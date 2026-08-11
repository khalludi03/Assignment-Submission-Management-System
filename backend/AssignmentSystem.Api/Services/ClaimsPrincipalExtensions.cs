using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AssignmentSystem.Api.Services;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var id = user.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return int.Parse(id ?? throw new UnauthorizedAccessException("Missing user id claim."));
    }
}
