using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AssignmentSystem.Api.Services;

namespace AssignmentSystem.Api.Tests;

public class AuthPolicyTests
{
    private static ClaimsPrincipal PrincipalWithRole(params string[] roles)
    {
        var identity = new ClaimsIdentity(
            roles.Select(r => new Claim(ClaimTypes.Role, r)), "test");
        return new ClaimsPrincipal(identity);
    }

    private static async Task<bool> IsAuthorizedAsync(string policyName, ClaimsPrincipal user)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization(AuthPolicies.Configure);

        await using var provider = services.BuildServiceProvider();
        var auth = provider.GetRequiredService<IAuthorizationService>();

        var result = await auth.AuthorizeAsync(user, resource: null, policyName);
        return result.Succeeded;
    }

    private static ClaimsPrincipal Anonymous() => new(new ClaimsIdentity());

    [Fact]
    public async Task AdminOnly_AllowsAdmin()
        => Assert.True(await IsAuthorizedAsync(AuthPolicies.AdminOnly, PrincipalWithRole("Admin")));

    [Fact]
    public async Task AdminOnly_DeniesTeacherAndStudent()
    {
        Assert.False(await IsAuthorizedAsync(AuthPolicies.AdminOnly, PrincipalWithRole("Teacher")));
        Assert.False(await IsAuthorizedAsync(AuthPolicies.AdminOnly, PrincipalWithRole("Student")));
    }

    [Fact]
    public async Task TeacherOnly_AllowsTeacher()
        => Assert.True(await IsAuthorizedAsync(AuthPolicies.TeacherOnly, PrincipalWithRole("Teacher")));

    [Fact]
    public async Task TeacherOnly_DeniesStudentAndAdmin()
    {
        Assert.False(await IsAuthorizedAsync(AuthPolicies.TeacherOnly, PrincipalWithRole("Student")));
        Assert.False(await IsAuthorizedAsync(AuthPolicies.TeacherOnly, PrincipalWithRole("Admin")));
    }

    [Fact]
    public async Task StudentOnly_AllowsStudent()
        => Assert.True(await IsAuthorizedAsync(AuthPolicies.StudentOnly, PrincipalWithRole("Student")));

    [Fact]
    public async Task StudentOnly_DeniesTeacher()
        => Assert.False(await IsAuthorizedAsync(AuthPolicies.StudentOnly, PrincipalWithRole("Teacher")));

    [Fact]
    public async Task TeacherOrAdmin_AllowsTeacherAndAdmin()
    {
        Assert.True(await IsAuthorizedAsync(AuthPolicies.TeacherOrAdmin, PrincipalWithRole("Teacher")));
        Assert.True(await IsAuthorizedAsync(AuthPolicies.TeacherOrAdmin, PrincipalWithRole("Admin")));
    }

    [Fact]
    public async Task TeacherOrAdmin_DeniesStudent()
        => Assert.False(await IsAuthorizedAsync(AuthPolicies.TeacherOrAdmin, PrincipalWithRole("Student")));

    [Theory]
    [InlineData(AuthPolicies.AdminOnly)]
    [InlineData(AuthPolicies.TeacherOnly)]
    [InlineData(AuthPolicies.StudentOnly)]
    [InlineData(AuthPolicies.TeacherOrAdmin)]
    public async Task AnonymousUser_IsDeniedByEveryPolicy(string policyName)
        => Assert.False(await IsAuthorizedAsync(policyName, Anonymous()));
}
