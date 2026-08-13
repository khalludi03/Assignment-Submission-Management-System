using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Services;

public interface IAssignmentService
{
    Task<AssignmentResponse> CreateAsync(int teacherId, CreateAssignmentRequest request);
    Task<AssignmentResponse> UpdateAsync(int teacherId, int assignmentId, UpdateAssignmentRequest request);
    Task DeleteAsync(int teacherId, int assignmentId);
    Task<AssignmentResponse> SetStatusAsync(int teacherId, int assignmentId, AssignmentStatus status);
    Task<List<AssignmentResponse>> GetForTeacherAsync(int teacherId);
    Task<List<AssignmentResponse>> GetForStudentAsync(int studentId);
    Task<List<TeacherAssignmentResponse>> GetTeachingAssignmentsAsync(int teacherId);
}

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _db;

    public AssignmentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AssignmentResponse> CreateAsync(int teacherId, CreateAssignmentRequest request)
    {
        ValidateRequest(request.Deadline, request.MaxMarks);

        var assigned = await _db.TeacherAssignments.AnyAsync(ta =>
            ta.TeacherId == teacherId &&
            ta.ClassId == request.ClassId &&
            ta.SubjectId == request.SubjectId);
        if (!assigned)
            throw new ForbiddenException("You are not assigned to teach this class and subject.");

        var assignment = new Assignment
        {
            Title = request.Title,
            Description = request.Description ?? string.Empty,
            Deadline = request.Deadline,
            MaxMarks = request.MaxMarks,
            Status = AssignmentStatus.Draft,
            TeacherId = teacherId,
            ClassId = request.ClassId,
            SubjectId = request.SubjectId
        };

        _db.Assignments.Add(assignment);
        await _db.SaveChangesAsync();
        return await BuildResponseAsync(assignment.Id);
    }

    public async Task<AssignmentResponse> UpdateAsync(int teacherId, int assignmentId, UpdateAssignmentRequest request)
    {
        var assignment = await FindOwnedAsync(teacherId, assignmentId);

        ValidateRequest(request.Deadline, request.MaxMarks);

        if (assignment.ClassId != request.ClassId || assignment.SubjectId != request.SubjectId)
        {
            var assigned = await _db.TeacherAssignments.AnyAsync(ta =>
                ta.TeacherId == teacherId &&
                ta.ClassId == request.ClassId &&
                ta.SubjectId == request.SubjectId);
            if (!assigned)
                throw new ForbiddenException("You are not assigned to teach this class and subject.");
        }

        assignment.Title = request.Title;
        assignment.Description = request.Description ?? string.Empty;
        assignment.Deadline = request.Deadline;
        assignment.MaxMarks = request.MaxMarks;
        assignment.ClassId = request.ClassId;
        assignment.SubjectId = request.SubjectId;

        await _db.SaveChangesAsync();
        return await BuildResponseAsync(assignment.Id);
    }

    public async Task DeleteAsync(int teacherId, int assignmentId)
    {
        var assignment = await FindOwnedAsync(teacherId, assignmentId);
        _db.Assignments.Remove(assignment);
        await _db.SaveChangesAsync();
    }

    public async Task<AssignmentResponse> SetStatusAsync(int teacherId, int assignmentId, AssignmentStatus status)
    {
        var assignment = await FindOwnedAsync(teacherId, assignmentId);
        assignment.Status = status;
        await _db.SaveChangesAsync();
        return await BuildResponseAsync(assignment.Id);
    }

    public async Task<List<AssignmentResponse>> GetForTeacherAsync(int teacherId)
    {
        var assignments = await _db.Assignments
            .Where(a => a.TeacherId == teacherId)
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Include(a => a.Teacher)
            .OrderByDescending(a => a.Deadline)
            .ToListAsync();

        return assignments.Select(ToResponse).ToList();
    }

    public async Task<List<AssignmentResponse>> GetForStudentAsync(int studentId)
    {
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == studentId)
            ?? throw new NotFoundException("Student not found.");

        var assignments = await _db.Assignments
            .Where(a => a.Status == AssignmentStatus.Published && a.ClassId == student.ClassId)
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Include(a => a.Teacher)
            .OrderByDescending(a => a.Deadline)
            .ToListAsync();

        return assignments.Select(ToResponse).ToList();
    }

    public async Task<List<TeacherAssignmentResponse>> GetTeachingAssignmentsAsync(int teacherId)
    {
        var assignments = await _db.TeacherAssignments.AsNoTracking()
            .Where(ta => ta.TeacherId == teacherId)
            .Include(ta => ta.Teacher)
            .Include(ta => ta.Class)
            .Include(ta => ta.Subject)
            .ToListAsync();

        return assignments.Select(ta => new TeacherAssignmentResponse(
            ta.TeacherId, ta.Teacher?.FullName ?? string.Empty,
            ta.ClassId, ta.Class.Name,
            ta.SubjectId, ta.Subject.Name)).ToList();
    }

    private async Task<Assignment> FindOwnedAsync(int teacherId, int assignmentId)
    {
        var assignment = await _db.Assignments.FindAsync(assignmentId)
            ?? throw new NotFoundException("Assignment not found.");
        if (assignment.TeacherId != teacherId)
            throw new ForbiddenException("You can only manage your own assignments.");
        return assignment;
    }

    private static void ValidateRequest(DateTime deadline, int maxMarks)
    {
        if (deadline <= DateTime.UtcNow)
            throw new BusinessRuleException("Deadline must be in the future.");
        if (maxMarks <= 0)
            throw new BusinessRuleException("Maximum marks must be a positive number.");
    }

    private async Task<AssignmentResponse> BuildResponseAsync(int assignmentId)
    {
        var assignment = await _db.Assignments
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Include(a => a.Teacher)
            .SingleAsync(a => a.Id == assignmentId);

        return ToResponse(assignment);
    }

    private static AssignmentResponse ToResponse(Assignment a) => new(
        a.Id,
        a.Title,
        a.Description,
        a.Deadline,
        a.MaxMarks,
        a.Status.ToString(),
        a.ClassId,
        a.Class.Name,
        a.SubjectId,
        a.Subject.Name,
        a.Teacher.FullName);
}
