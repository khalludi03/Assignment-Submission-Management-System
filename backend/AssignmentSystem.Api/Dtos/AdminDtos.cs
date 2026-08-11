using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.Api.Dtos;

public record CreateUserRequest(
    [Required] string FullName,
    [Required] string Email,
    [Required] string Password,
    [Required] string Role,
    int? ClassId);

public record UserResponse(
    int Id,
    string Email,
    string FullName,
    string Role,
    int? ClassId,
    string? ClassName);

public record CreateClassRequest(
    [Required] string Name);

public record ClassResponse(
    int Id,
    string Name);

public record CreateSubjectRequest(
    [Required] string Name);

public record SubjectResponse(
    int Id,
    string Name);

public record AssignTeacherRequest(
    int TeacherId,
    int ClassId,
    int SubjectId);

public record TeacherAssignmentResponse(
    int TeacherId,
    string TeacherName,
    int ClassId,
    string ClassName,
    int SubjectId,
    string SubjectName);
