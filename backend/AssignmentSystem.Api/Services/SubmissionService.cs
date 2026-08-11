using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Services;

public interface ISubmissionService
{
    Task<SubmissionResponse> SubmitOrUpdateAsync(int studentId, int assignmentId, CreateSubmissionRequest request);
    Task<List<SubmissionResponse>> GetMineAsync(int studentId);
    Task<List<SubmissionResponse>> GetByAssignmentAsync(int teacherId, int assignmentId);
    Task<SubmissionResponse> GradeAsync(int teacherId, int submissionId, GradeSubmissionRequest request);
    Task<SubmissionResponse> SetStatusAsync(int teacherId, int submissionId, SubmissionStatus status);
}

public class SubmissionService : ISubmissionService
{
    private readonly AppDbContext _db;

    public SubmissionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<SubmissionResponse> SubmitOrUpdateAsync(int studentId, int assignmentId, CreateSubmissionRequest request)
    {
        var assignment = await _db.Assignments.FindAsync(assignmentId)
            ?? throw new NotFoundException("Assignment not found.");
        if (assignment.Status != AssignmentStatus.Published)
            throw new BusinessRuleException("This assignment is not published yet.");

        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == studentId)
            ?? throw new NotFoundException("Student not found.");
        if (student.ClassId != assignment.ClassId)
            throw new ForbiddenException("This assignment is not for your class.");

        var now = DateTime.UtcNow;
        var existing = await _db.Submissions.FirstOrDefaultAsync(s =>
            s.AssignmentId == assignmentId && s.StudentId == studentId);

        if (existing is null)
        {
            if (now > assignment.Deadline)
                throw new BusinessRuleException("The deadline has passed; submissions are closed.");

            var submission = new Submission
            {
                AssignmentId = assignmentId,
                StudentId = studentId,
                Answer = request.Answer,
                Status = SubmissionStatus.Submitted,
                SubmittedAt = now
            };
            _db.Submissions.Add(submission);
            await _db.SaveChangesAsync();
            return await BuildResponseAsync(submission.Id);
        }

        if (existing.Status == SubmissionStatus.Graded)
            throw new BusinessRuleException("This submission has already been graded and cannot be changed.");
        if (now > assignment.Deadline)
            throw new BusinessRuleException("The deadline has passed; you can no longer update your submission.");

        existing.Answer = request.Answer;
        existing.UpdatedAt = now;
        await _db.SaveChangesAsync();
        return await BuildResponseAsync(existing.Id);
    }

    public async Task<List<SubmissionResponse>> GetMineAsync(int studentId)
    {
        var submissions = await _db.Submissions
            .Where(s => s.StudentId == studentId)
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return submissions.Select(ToResponse).ToList();
    }

    public async Task<List<SubmissionResponse>> GetByAssignmentAsync(int teacherId, int assignmentId)
    {
        var assignment = await _db.Assignments.FindAsync(assignmentId)
            ?? throw new NotFoundException("Assignment not found.");
        if (assignment.TeacherId != teacherId)
            throw new ForbiddenException("You can only view submissions for your own assignments.");

        var submissions = await _db.Submissions
            .Where(s => s.AssignmentId == assignmentId)
            .Include(s => s.Student)
            .OrderBy(s => s.SubmittedAt)
            .ToListAsync();

        return submissions.Select(ToResponse).ToList();
    }

    public async Task<SubmissionResponse> GradeAsync(int teacherId, int submissionId, GradeSubmissionRequest request)
    {
        var submission = await FindForTeacherAsync(teacherId, submissionId);

        if (request.Marks < 0 || request.Marks > submission.Assignment.MaxMarks)
            throw new BusinessRuleException($"Marks must be between 0 and {submission.Assignment.MaxMarks}.");

        submission.Marks = request.Marks;
        submission.Feedback = request.Feedback;
        submission.Status = request.Status ?? SubmissionStatus.Graded;
        await _db.SaveChangesAsync();
        return await BuildResponseAsync(submission.Id);
    }

    public async Task<SubmissionResponse> SetStatusAsync(int teacherId, int submissionId, SubmissionStatus status)
    {
        var submission = await FindForTeacherAsync(teacherId, submissionId);
        submission.Status = status;
        await _db.SaveChangesAsync();
        return await BuildResponseAsync(submission.Id);
    }

    private async Task<Submission> FindForTeacherAsync(int teacherId, int submissionId)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw new NotFoundException("Submission not found.");
        if (submission.Assignment.TeacherId != teacherId)
            throw new ForbiddenException("You can only manage submissions for your own assignments.");
        return submission;
    }

    private async Task<SubmissionResponse> BuildResponseAsync(int submissionId)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .SingleAsync(s => s.Id == submissionId);

        return ToResponse(submission);
    }

    private static SubmissionResponse ToResponse(Submission s) => new(
        s.Id,
        s.Answer,
        s.Status.ToString(),
        s.Marks,
        s.Feedback,
        s.SubmittedAt,
        s.UpdatedAt,
        s.AssignmentId,
        s.Assignment.Title,
        s.StudentId,
        s.Student.FullName);
}
