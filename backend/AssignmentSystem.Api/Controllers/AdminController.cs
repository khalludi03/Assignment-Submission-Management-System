using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Services;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _service;

    public AdminController(IAdminService service)
    {
        _service = service;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserResponse>>> GetUsers()
        => Ok(await _service.GetUsersAsync());

    [HttpPost("users")]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request)
        => StatusCode(StatusCodes.Status201Created, await _service.CreateUserAsync(request));

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        await _service.DeleteUserAsync(id);
        return NoContent();
    }

    [HttpGet("classes")]
    public async Task<ActionResult<List<ClassResponse>>> GetClasses()
        => Ok(await _service.GetClassesAsync());

    [HttpPost("classes")]
    public async Task<ActionResult<ClassResponse>> CreateClass(CreateClassRequest request)
        => StatusCode(StatusCodes.Status201Created, await _service.CreateClassAsync(request));

    [HttpDelete("classes/{id:int}")]
    public async Task<IActionResult> DeleteClass(int id)
    {
        await _service.DeleteClassAsync(id);
        return NoContent();
    }

    [HttpGet("subjects")]
    public async Task<ActionResult<List<SubjectResponse>>> GetSubjects()
        => Ok(await _service.GetSubjectsAsync());

    [HttpPost("subjects")]
    public async Task<ActionResult<SubjectResponse>> CreateSubject(CreateSubjectRequest request)
        => StatusCode(StatusCodes.Status201Created, await _service.CreateSubjectAsync(request));

    [HttpDelete("subjects/{id:int}")]
    public async Task<IActionResult> DeleteSubject(int id)
    {
        await _service.DeleteSubjectAsync(id);
        return NoContent();
    }

    [HttpGet("teacher-assignments")]
    public async Task<ActionResult<List<TeacherAssignmentResponse>>> GetTeacherAssignments()
        => Ok(await _service.GetTeacherAssignmentsAsync());

    [HttpPost("teacher-assignments")]
    public async Task<IActionResult> AssignTeacher(AssignTeacherRequest request)
    {
        await _service.AssignTeacherAsync(request);
        return NoContent();
    }

    [HttpDelete("teacher-assignments/{teacherId:int}/{classId:int}/{subjectId:int}")]
    public async Task<IActionResult> UnassignTeacher(int teacherId, int classId, int subjectId)
    {
        await _service.UnassignTeacherAsync(teacherId, classId, subjectId);
        return NoContent();
    }

    [HttpGet("assignments")]
    public async Task<ActionResult<List<AssignmentResponse>>> GetAllAssignments()
        => Ok(await _service.GetAllAssignmentsAsync());

    [HttpGet("submissions")]
    public async Task<ActionResult<List<SubmissionResponse>>> GetAllSubmissions()
        => Ok(await _service.GetAllSubmissionsAsync());
}
