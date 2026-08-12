using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Services;

namespace AssignmentSystem.Api.Tests;

public class SubmissionServiceTests
{
    private readonly TestFixture _fx;
    private readonly SubmissionService _service;

    public SubmissionServiceTests()
    {
        _fx = new TestFixture();
        _service = new SubmissionService(_fx.Db);
    }

    [Fact]
    public async Task Submit_ToPublishedAssignment_CreatesSubmission()
    {
        var result = await _service.SubmitOrUpdateAsync(
            TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("answer"));

        Assert.Equal("Submitted", result.Status);
        Assert.Equal("answer", result.Answer);
        Assert.Equal(TestFixture.StudentS, result.StudentId);
    }

    [Fact]
    public async Task Submit_ToDraftAssignment_ThrowsBusinessRule()
    {
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.DraftForClassTen, new CreateSubmissionRequest("x")));

        Assert.Contains("not published", ex.Message);
    }

    [Fact]
    public async Task Submit_ToAssignmentOfAnotherClass_ThrowsForbidden()
    {
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.PublishedForClassNine, new CreateSubmissionRequest("x")));
    }

    [Fact]
    public async Task Submit_ToExpiredAssignment_ThrowsBusinessRule()
    {
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.ExpiredPublished, new CreateSubmissionRequest("x")));

        Assert.Contains("deadline", ex.Message);
    }

    [Fact]
    public async Task Submit_TwiceBeforeDeadline_UpdatesSameSubmission()
    {
        await _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("first"));
        var result = await _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("second"));

        var count = await _fx.Db.Submissions.CountAsync();
        Assert.Equal(1, count);
        Assert.Equal("second", result.Answer);
        Assert.NotNull(result.UpdatedAt);
    }

    [Fact]
    public async Task Submit_AfterDeadline_WhenSubmissionExists_ThrowsBusinessRule()
    {
        _fx.Db.Submissions.Add(new Submission
        {
            AssignmentId = TestFixture.ExpiredPublished,
            StudentId = TestFixture.StudentS,
            Answer = "old",
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow.AddDays(-2)
        });
        await _fx.Db.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.ExpiredPublished, new CreateSubmissionRequest("new")));

        Assert.Contains("deadline", ex.Message);
    }

    [Fact]
    public async Task Submit_AfterGraded_ThrowsBusinessRule()
    {
        await _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("answer"));

        var grade = new GradeSubmissionRequest(80, "good", null);
        await _service.GradeAsync(TestFixture.TeacherA, 1, grade);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("resubmit")));

        Assert.Contains("graded", ex.Message);
    }

    [Fact]
    public async Task Grade_ByOwner_SetsMarksFeedbackAndStatus()
    {
        var submission = await _service.SubmitOrUpdateAsync(
            TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("answer"));

        var result = await _service.GradeAsync(TestFixture.TeacherA, submission.Id, new GradeSubmissionRequest(75, "well done", null));

        Assert.Equal("Graded", result.Status);
        Assert.Equal(75, result.Marks);
        Assert.Equal("well done", result.Feedback);
    }

    [Fact]
    public async Task Grade_ByAnotherTeacher_ThrowsForbidden()
    {
        var submission = await _service.SubmitOrUpdateAsync(
            TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("answer"));

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GradeAsync(TestFixture.TeacherB, submission.Id, new GradeSubmissionRequest(50, null, null)));
    }

    [Fact]
    public async Task Grade_MarksAboveMaximum_ThrowsBusinessRule()
    {
        var submission = await _service.SubmitOrUpdateAsync(
            TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("answer"));

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _service.GradeAsync(TestFixture.TeacherA, submission.Id, new GradeSubmissionRequest(150, null, null)));

        Assert.Contains("between 0 and 100", ex.Message);
    }

    [Fact]
    public async Task Grade_NegativeMarks_ThrowsBusinessRule()
    {
        var submission = await _service.SubmitOrUpdateAsync(
            TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("answer"));

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _service.GradeAsync(TestFixture.TeacherA, submission.Id, new GradeSubmissionRequest(-5, null, null)));
    }

    [Fact]
    public async Task GetByAssignment_ByNonOwnerTeacher_ThrowsForbidden()
    {
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetByAssignmentAsync(TestFixture.TeacherB, TestFixture.PublishedForClassTen));
    }

    [Fact]
    public async Task SetStatus_ByOwner_ChangesStatus()
    {
        var submission = await _service.SubmitOrUpdateAsync(
            TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("answer"));

        var result = await _service.SetStatusAsync(TestFixture.TeacherA, submission.Id, SubmissionStatus.Rejected);

        Assert.Equal("Rejected", result.Status);
    }

    [Fact]
    public async Task GetMine_ReturnsOnlyOwnSubmissions()
    {
        await _service.SubmitOrUpdateAsync(TestFixture.StudentS, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("s"));
        await _service.SubmitOrUpdateAsync(TestFixture.StudentT, TestFixture.PublishedForClassTen, new CreateSubmissionRequest("t"));

        var mine = await _service.GetMineAsync(TestFixture.StudentS);

        Assert.Single(mine);
        Assert.Equal(TestFixture.StudentS, mine[0].StudentId);
    }

    [Fact]
    public async Task Grade_NonexistentSubmission_ThrowsNotFound()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GradeAsync(TestFixture.TeacherA, 999, new GradeSubmissionRequest(10, null, null)));
    }
}
