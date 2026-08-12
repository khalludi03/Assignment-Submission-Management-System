using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Services;

namespace AssignmentSystem.Api.Tests;

public class AssignmentServiceTests
{
    private readonly TestFixture _fx;
    private readonly AssignmentService _service;

    public AssignmentServiceTests()
    {
        _fx = new TestFixture();
        _service = new AssignmentService(_fx.Db);
    }

    private static CreateAssignmentRequest Request(
        int classId = TestFixture.ClassTen,
        int subjectId = TestFixture.Math,
        DateTime? deadline = null,
        int maxMarks = 50) =>
        new("Title", "Description", deadline ?? DateTime.UtcNow.AddDays(3), maxMarks, classId, subjectId);

    [Fact]
    public async Task Create_ByAssignedTeacher_ReturnsDraftAssignment()
    {
        var result = await _service.CreateAsync(TestFixture.TeacherA, Request());

        Assert.Equal("Draft", result.Status);
        Assert.Equal("Title", result.Title);
        Assert.Equal(TestFixture.ClassTen, result.ClassId);
        Assert.Equal(TestFixture.Math, result.SubjectId);
    }

    [Fact]
    public async Task Create_ByTeacherNotAssigned_ThrowsForbidden()
    {
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.CreateAsync(TestFixture.TeacherB, Request()));

        Assert.Contains("not assigned", ex.Message);
    }

    [Fact]
    public async Task Create_ByTeacherForWrongSubject_ThrowsForbidden()
    {
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.CreateAsync(TestFixture.TeacherA, Request(subjectId: TestFixture.English)));

        Assert.Contains("not assigned", ex.Message);
    }

    [Fact]
    public async Task Create_WithPastDeadline_ThrowsBusinessRule()
    {
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _service.CreateAsync(TestFixture.TeacherA, Request(deadline: DateTime.UtcNow.AddDays(-1))));

        Assert.Contains("future", ex.Message);
    }

    [Fact]
    public async Task Create_WithNonPositiveMarks_ThrowsBusinessRule()
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _service.CreateAsync(TestFixture.TeacherA, Request(maxMarks: 0)));
    }

    [Fact]
    public async Task GetForStudent_ReturnsOnlyPublishedAssignmentsOfTheirClass()
    {
        var result = await _service.GetForStudentAsync(TestFixture.StudentS);

        var ids = result.Select(a => a.Id).ToArray();
        Assert.Contains(TestFixture.PublishedForClassTen, ids);
        Assert.Contains(TestFixture.ExpiredPublished, ids);
        Assert.DoesNotContain(TestFixture.DraftForClassTen, ids);
        Assert.DoesNotContain(TestFixture.PublishedForClassNine, ids);
    }

    [Fact]
    public async Task Update_ByAnotherTeacher_ThrowsForbidden()
    {
        var request = new UpdateAssignmentRequest("New", "d", DateTime.UtcNow.AddDays(5), 80,
            TestFixture.ClassTen, TestFixture.Math);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.UpdateAsync(TestFixture.TeacherB, TestFixture.PublishedForClassTen, request));
    }

    [Fact]
    public async Task SetStatus_ByOwner_PublishesDraft()
    {
        var result = await _service.SetStatusAsync(
            TestFixture.TeacherA, TestFixture.DraftForClassTen, AssignmentStatus.Published);

        Assert.Equal("Published", result.Status);
    }

    [Fact]
    public async Task SetStatus_ByAnotherTeacher_ThrowsForbidden()
    {
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.SetStatusAsync(TestFixture.TeacherB, TestFixture.DraftForClassTen, AssignmentStatus.Published));
    }

    [Fact]
    public async Task Delete_ByOwner_RemovesAssignment()
    {
        await _service.DeleteAsync(TestFixture.TeacherA, TestFixture.DraftForClassTen);

        var remaining = await _service.GetForTeacherAsync(TestFixture.TeacherA);
        Assert.DoesNotContain(TestFixture.DraftForClassTen, remaining.Select(a => a.Id));
    }

    [Fact]
    public async Task Delete_NonExistentAssignment_ThrowsNotFound()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.DeleteAsync(TestFixture.TeacherA, 999));
    }

    [Fact]
    public async Task GetForTeacher_ReturnsOnlyOwnAssignments()
    {
        var teacherA = await _service.GetForTeacherAsync(TestFixture.TeacherA);
        var teacherB = await _service.GetForTeacherAsync(TestFixture.TeacherB);

        Assert.Equal(4, teacherA.Count);
        Assert.Empty(teacherB);
    }
}
