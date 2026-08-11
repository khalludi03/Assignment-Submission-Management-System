namespace AssignmentSystem.Api.Services;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found");
            await WriteError(context, StatusCodes.Status404NotFound, ex.Message);
        }
        catch (ForbiddenException ex)
        {
            _logger.LogWarning(ex, "Forbidden");
            await WriteError(context, StatusCodes.Status403Forbidden, ex.Message);
        }
        catch (BusinessRuleException ex)
        {
            _logger.LogWarning(ex, "Business rule violation");
            await WriteError(context, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteError(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    private static async Task WriteError(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new { message });
    }
}
