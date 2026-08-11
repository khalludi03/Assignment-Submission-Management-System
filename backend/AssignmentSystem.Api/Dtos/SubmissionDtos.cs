using System.ComponentModel.DataAnnotations;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Dtos;

public record CreateSubmissionRequest(
    [Required] string Answer);

public record GradeSubmissionRequest(
    int Marks,
    string? Feedback,
    SubmissionStatus? Status);

public record SubmissionResponse(
    int Id,
    string Answer,
    string Status,
    int? Marks,
    string? Feedback,
    DateTime SubmittedAt,
    DateTime? UpdatedAt,
    int AssignmentId,
    string AssignmentTitle,
    int StudentId,
    string StudentName);
