using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Api.Dtos;

public record CreateAssignmentRequest(
    [Required] string Title,
    string? Description,
    [Required] DateTime Deadline,
    int MaxMarks,
    int ClassId,
    int SubjectId);

public record UpdateAssignmentRequest(
    [Required] string Title,
    string? Description,
    [Required] DateTime Deadline,
    int MaxMarks,
    int ClassId,
    int SubjectId);

public record AssignmentResponse(
    int Id,
    string Title,
    string Description,
    DateTime Deadline,
    int MaxMarks,
    string Status,
    int ClassId,
    string ClassName,
    int SubjectId,
    string SubjectName,
    string TeacherName);
