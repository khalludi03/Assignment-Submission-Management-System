using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Services;

public interface IAdminService
{
    Task<List<UserResponse>> GetUsersAsync();
    Task<UserResponse> CreateUserAsync(CreateUserRequest request);
    Task DeleteUserAsync(int userId);
    Task<List<ClassResponse>> GetClassesAsync();
    Task<ClassResponse> CreateClassAsync(CreateClassRequest request);
    Task DeleteClassAsync(int classId);
    Task<List<SubjectResponse>> GetSubjectsAsync();
    Task<SubjectResponse> CreateSubjectAsync(CreateSubjectRequest request);
    Task DeleteSubjectAsync(int subjectId);
    Task<List<TeacherAssignmentResponse>> GetTeacherAssignmentsAsync();
    Task AssignTeacherAsync(AssignTeacherRequest request);
    Task UnassignTeacherAsync(int teacherId, int classId, int subjectId);
}

public class AdminService : IAdminService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _hasher;

    public AdminService(AppDbContext db, IPasswordHasher<User> hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    public async Task<List<UserResponse>> GetUsersAsync()
    {
        var users = await _db.Users.AsNoTracking().ToListAsync();
        var classes = await _db.Classes.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.Name);

        return users.Select(u => new UserResponse(
            u.Id,
            u.Email,
            u.FullName,
            u.GetType().Name,
            u is Student student ? student.ClassId : null,
            u is Student s ? classes.GetValueOrDefault(s.ClassId) : null)).ToList();
    }

    public async Task<UserResponse> CreateUserAsync(CreateUserRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new BusinessRuleException($"An account with email '{request.Email}' already exists.");

        var user = request.Role.ToLowerInvariant() switch
        {
            "admin" => (User)new Admin(),
            "teacher" => (User)new Teacher(),
            "student" => await BuildStudentAsync(request),
            _ => throw new BusinessRuleException($"Unknown role '{request.Role}'.")
        };

        user.Email = request.Email;
        user.FullName = request.FullName;
        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return (await GetUsersAsync()).Single(u => u.Id == user.Id);
    }

    public async Task DeleteUserAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException("User not found.");

        if (await _db.Assignments.AnyAsync(a => a.TeacherId == userId))
            throw new BusinessRuleException("Cannot delete: this user owns assignments.");
        if (await _db.Submissions.AnyAsync(s => s.StudentId == userId))
            throw new BusinessRuleException("Cannot delete: this user has submissions.");
        if (await _db.TeacherAssignments.AnyAsync(ta => ta.TeacherId == userId))
            throw new BusinessRuleException("Cannot delete: this user is assigned to teach.");

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
    }

    public async Task<List<ClassResponse>> GetClassesAsync()
        => await _db.Classes.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new ClassResponse(c.Id, c.Name))
            .ToListAsync();

    public async Task<ClassResponse> CreateClassAsync(CreateClassRequest request)
    {
        if (await _db.Classes.AnyAsync(c => c.Name == request.Name))
            throw new BusinessRuleException($"A class named '{request.Name}' already exists.");

        var cls = new Class { Name = request.Name };
        _db.Classes.Add(cls);
        await _db.SaveChangesAsync();
        return new ClassResponse(cls.Id, cls.Name);
    }

    public async Task DeleteClassAsync(int classId)
    {
        var cls = await _db.Classes.FindAsync(classId)
            ?? throw new NotFoundException("Class not found.");

        if (await _db.Students.AnyAsync(s => s.ClassId == classId))
            throw new BusinessRuleException("Cannot delete: the class has students.");
        if (await _db.Assignments.AnyAsync(a => a.ClassId == classId))
            throw new BusinessRuleException("Cannot delete: the class has assignments.");
        if (await _db.TeacherAssignments.AnyAsync(ta => ta.ClassId == classId))
            throw new BusinessRuleException("Cannot delete: the class has assigned teachers.");

        _db.Classes.Remove(cls);
        await _db.SaveChangesAsync();
    }

    public async Task<List<SubjectResponse>> GetSubjectsAsync()
        => await _db.Subjects.AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new SubjectResponse(s.Id, s.Name))
            .ToListAsync();

    public async Task<SubjectResponse> CreateSubjectAsync(CreateSubjectRequest request)
    {
        if (await _db.Subjects.AnyAsync(s => s.Name == request.Name))
            throw new BusinessRuleException($"A subject named '{request.Name}' already exists.");

        var subject = new Subject { Name = request.Name };
        _db.Subjects.Add(subject);
        await _db.SaveChangesAsync();
        return new SubjectResponse(subject.Id, subject.Name);
    }

    public async Task DeleteSubjectAsync(int subjectId)
    {
        var subject = await _db.Subjects.FindAsync(subjectId)
            ?? throw new NotFoundException("Subject not found.");

        if (await _db.Assignments.AnyAsync(a => a.SubjectId == subjectId))
            throw new BusinessRuleException("Cannot delete: the subject has assignments.");
        if (await _db.TeacherAssignments.AnyAsync(ta => ta.SubjectId == subjectId))
            throw new BusinessRuleException("Cannot delete: the subject has assigned teachers.");

        _db.Subjects.Remove(subject);
        await _db.SaveChangesAsync();
    }

    public async Task<List<TeacherAssignmentResponse>> GetTeacherAssignmentsAsync()
    {
        var assignments = await _db.TeacherAssignments.AsNoTracking()
            .Include(ta => ta.Teacher)
            .Include(ta => ta.Class)
            .Include(ta => ta.Subject)
            .ToListAsync();

        return assignments.Select(ta => new TeacherAssignmentResponse(
            ta.TeacherId, ta.Teacher.FullName,
            ta.ClassId, ta.Class.Name,
            ta.SubjectId, ta.Subject.Name)).ToList();
    }

    public async Task AssignTeacherAsync(AssignTeacherRequest request)
    {
        var teacher = await _db.Users.FindAsync(request.TeacherId)
            ?? throw new NotFoundException("Teacher not found.");
        if (teacher is not Teacher)
            throw new BusinessRuleException("The selected user is not a teacher.");

        if (!await _db.Classes.AnyAsync(c => c.Id == request.ClassId))
            throw new NotFoundException("Class not found.");
        if (!await _db.Subjects.AnyAsync(s => s.Id == request.SubjectId))
            throw new NotFoundException("Subject not found.");

        var duplicate = await _db.TeacherAssignments.AnyAsync(ta =>
            ta.TeacherId == request.TeacherId &&
            ta.ClassId == request.ClassId &&
            ta.SubjectId == request.SubjectId);
        if (duplicate)
            throw new BusinessRuleException("This teacher is already assigned to that class and subject.");

        _db.TeacherAssignments.Add(new TeacherAssignment
        {
            TeacherId = request.TeacherId,
            ClassId = request.ClassId,
            SubjectId = request.SubjectId
        });
        await _db.SaveChangesAsync();
    }

    public async Task UnassignTeacherAsync(int teacherId, int classId, int subjectId)
    {
        var assignment = await _db.TeacherAssignments.FirstOrDefaultAsync(ta =>
            ta.TeacherId == teacherId && ta.ClassId == classId && ta.SubjectId == subjectId)
            ?? throw new NotFoundException("Teacher assignment not found.");

        _db.TeacherAssignments.Remove(assignment);
        await _db.SaveChangesAsync();
    }

    private async Task<Student> BuildStudentAsync(CreateUserRequest request)
    {
        if (request.ClassId is null)
            throw new BusinessRuleException("ClassId is required when creating a student.");

        var cls = await _db.Classes.FindAsync(request.ClassId)
            ?? throw new NotFoundException("Class not found.");

        return new Student { ClassId = cls.Id };
    }
}
