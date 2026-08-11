using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Services;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/submissions")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _service;

    public SubmissionsController(ISubmissionService service)
    {
        _service = service;
    }

    [HttpPost("{assignmentId:int}")]
    [Authorize(Policy = "StudentOnly")]
    public async Task<ActionResult<SubmissionResponse>> SubmitOrUpdate(int assignmentId, CreateSubmissionRequest request)
    {
        var submission = await _service.SubmitOrUpdateAsync(User.GetUserId(), assignmentId, request);
        return StatusCode(StatusCodes.Status201Created, submission);
    }

    [HttpGet("mine")]
    [Authorize(Policy = "StudentOnly")]
    public async Task<ActionResult<List<SubmissionResponse>>> GetMine()
        => Ok(await _service.GetMineAsync(User.GetUserId()));

    [HttpGet("assignment/{assignmentId:int}")]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<ActionResult<List<SubmissionResponse>>> GetByAssignment(int assignmentId)
        => Ok(await _service.GetByAssignmentAsync(User.GetUserId(), assignmentId));

    [HttpPut("{id:int}/grade")]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<ActionResult<SubmissionResponse>> Grade(int id, GradeSubmissionRequest request)
        => Ok(await _service.GradeAsync(User.GetUserId(), id, request));

    [HttpPut("{id:int}/status")]
    [Authorize(Policy = "TeacherOnly")]
    public async Task<ActionResult<SubmissionResponse>> SetStatus(int id, [FromBody] SubmissionStatus status)
        => Ok(await _service.SetStatusAsync(User.GetUserId(), id, status));
}
