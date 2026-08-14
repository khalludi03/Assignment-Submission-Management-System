using Microsoft.AspNetCore.Identity;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Services;

namespace AssignmentSystem.Api.Tests;

public class AdminServiceTests
{
    private readonly TestFixture _fx;
    private readonly AdminService _service;

    public AdminServiceTests()
    {
        _fx = new TestFixture();
        _service = new AdminService(_fx.Db, new PasswordHasher<User>());

        _fx.Db.Submissions.AddRange(
            new Submission
            {
                Id = 1,
                Answer = "answer one",
                Status = SubmissionStatus.Submitted,
                AssignmentId = TestFixture.PublishedForClassTen,
                StudentId = TestFixture.StudentS
            },
            new Submission
            {
                Id = 2,
                Answer = "answer two",
                Status = SubmissionStatus.Graded,
                Marks = 80,
                Feedback = "nice",
                AssignmentId = TestFixture.PublishedForClassTen,
                StudentId = TestFixture.StudentT
            });
        _fx.Db.SaveChanges();
    }

    [Fact]
    public async Task GetAllAssignments_ReturnsAllForEveryTeacherAndStatus()
    {
        var result = await _service.GetAllAssignmentsAsync();

        Assert.Equal(4, result.Count);
        Assert.Contains(result, a => a.Status == "Draft");
        Assert.Contains(result, a => a.Status == "Published");
        Assert.All(result, a => Assert.Equal("Teacher A", a.TeacherName));
    }

    [Fact]
    public async Task GetAllSubmissions_ReturnsEverySubmissionWithRelatedNames()
    {
        var result = await _service.GetAllSubmissionsAsync();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, s => s.StudentId == TestFixture.StudentS && s.StudentName == "Student S" && s.Status == "Submitted");
        Assert.Contains(result, s => s.StudentId == TestFixture.StudentT && s.StudentName == "Student T" && s.Marks == 80);
        Assert.All(result, s => Assert.Equal("Published 10", s.AssignmentTitle));
    }
}
