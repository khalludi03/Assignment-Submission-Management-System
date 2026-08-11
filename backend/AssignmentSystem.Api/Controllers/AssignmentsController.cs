using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Services;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _service;

    public AssignmentsController(IAssignmentService service)
    {
        _service = service;
    }

    [HttpGet("my")]
    [Authorize(Policy = "StudentOnly")]
    public async Task<ActionResult<List<AssignmentResponse>>> GetForStudent()
        => Ok(await _service.GetForStudentAsync(User.GetUserId()));

    [HttpGet("teacher")]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<ActionResult<List<AssignmentResponse>>> GetForTeacher()
        => Ok(await _service.GetForTeacherAsync(User.GetUserId()));

    [HttpPost]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<ActionResult<AssignmentResponse>> Create(CreateAssignmentRequest request)
    {
        var created = await _service.CreateAsync(User.GetUserId(), request);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<ActionResult<AssignmentResponse>> Update(int id, UpdateAssignmentRequest request)
        => Ok(await _service.UpdateAsync(User.GetUserId(), id, request));

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(User.GetUserId(), id);
        return NoContent();
    }

    [HttpPost("{id:int}/publish")]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<ActionResult<AssignmentResponse>> Publish(int id)
        => Ok(await _service.SetStatusAsync(User.GetUserId(), id, AssignmentStatus.Published));

    [HttpPost("{id:int}/unpublish")]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<ActionResult<AssignmentResponse>> Unpublish(int id)
        => Ok(await _service.SetStatusAsync(User.GetUserId(), id, AssignmentStatus.Draft));
}
