using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
            return;

        var hasher = new PasswordHasher<User>();

        var cls = new Class { Name = "Class 10" };
        var math = new Subject { Name = "Mathematics" };
        var english = new Subject { Name = "English" };
        db.Classes.Add(cls);
        db.Subjects.AddRange(math, english);

        var admin = new Admin { Email = "admin@school.com", FullName = "System Admin" };
        admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");

        var teacher = new Teacher { Email = "teacher@school.com", FullName = "Mr. Rahman" };
        teacher.PasswordHash = hasher.HashPassword(teacher, "Teacher@123");

        var student = new Student { Email = "student@school.com", FullName = "Rahim Uddin", Class = cls };
        student.PasswordHash = hasher.HashPassword(student, "Student@123");

        db.Users.AddRange(admin, teacher, student);
        db.TeacherAssignments.Add(new TeacherAssignment { Teacher = teacher, Class = cls, Subject = math });

        var assignment = new Assignment
        {
            Title = "Algebra Worksheet",
            Description = "Solve problems 1-20 from chapter 3.",
            Deadline = DateTime.UtcNow.AddDays(7),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            Teacher = teacher,
            Class = cls,
            Subject = math
        };
        db.Assignments.Add(assignment);

        db.Submissions.Add(new Submission
        {
            Assignment = assignment,
            Student = student,
            Answer = "Step-by-step solution written here.",
            Status = SubmissionStatus.Graded,
            Marks = 85,
            Feedback = "Good work. Review question 14.",
            SubmittedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }
}
