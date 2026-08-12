using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Tests;

public sealed class TestFixture : IDisposable
{
    public AppDbContext Db { get; }

    public const int TeacherA = 1;
    public const int TeacherB = 2;
    public const int StudentS = 3;
    public const int StudentT = 4;
    public const int ClassTen = 1;
    public const int ClassNine = 2;
    public const int Math = 1;
    public const int English = 2;
    public const int PublishedForClassTen = 1;
    public const int DraftForClassTen = 2;
    public const int PublishedForClassNine = 3;
    public const int ExpiredPublished = 4;

    public TestFixture()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        Db = new AppDbContext(options);
        Seed();
    }

    private void Seed()
    {
        Db.AddRange(
            new Class { Id = ClassTen, Name = "Class 10" },
            new Class { Id = ClassNine, Name = "Class 9" });
        Db.AddRange(
            new Subject { Id = Math, Name = "Mathematics" },
            new Subject { Id = English, Name = "English" });

        Db.AddRange(
            new Teacher { Id = TeacherA, Email = "a@school.com", FullName = "Teacher A", PasswordHash = "hash" },
            new Teacher { Id = TeacherB, Email = "b@school.com", FullName = "Teacher B", PasswordHash = "hash" },
            new Student { Id = StudentS, Email = "s@school.com", FullName = "Student S", ClassId = ClassTen, PasswordHash = "hash" },
            new Student { Id = StudentT, Email = "t@school.com", FullName = "Student T", ClassId = ClassTen, PasswordHash = "hash" });

        Db.TeacherAssignments.AddRange(
            new TeacherAssignment { TeacherId = TeacherA, ClassId = ClassTen, SubjectId = Math },
            new TeacherAssignment { TeacherId = TeacherA, ClassId = ClassNine, SubjectId = Math });

        Db.Assignments.AddRange(
            new Assignment
            {
                Id = PublishedForClassTen, Title = "Published 10", Description = "d",
                Deadline = DateTime.UtcNow.AddDays(7), MaxMarks = 100,
                Status = AssignmentStatus.Published,
                TeacherId = TeacherA, ClassId = ClassTen, SubjectId = Math
            },
            new Assignment
            {
                Id = DraftForClassTen, Title = "Draft 10", Description = "d",
                Deadline = DateTime.UtcNow.AddDays(7), MaxMarks = 100,
                Status = AssignmentStatus.Draft,
                TeacherId = TeacherA, ClassId = ClassTen, SubjectId = Math
            },
            new Assignment
            {
                Id = PublishedForClassNine, Title = "Published 9", Description = "d",
                Deadline = DateTime.UtcNow.AddDays(7), MaxMarks = 100,
                Status = AssignmentStatus.Published,
                TeacherId = TeacherA, ClassId = ClassNine, SubjectId = Math
            },
            new Assignment
            {
                Id = ExpiredPublished, Title = "Expired", Description = "d",
                Deadline = DateTime.UtcNow.AddDays(-1), MaxMarks = 100,
                Status = AssignmentStatus.Published,
                TeacherId = TeacherA, ClassId = ClassTen, SubjectId = Math
            });

        Db.SaveChanges();
    }

    public void Dispose() => Db.Dispose();
}
