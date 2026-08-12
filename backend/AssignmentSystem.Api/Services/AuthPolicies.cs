using Microsoft.AspNetCore.Authorization;

namespace AssignmentSystem.Api.Services;

public static class AuthPolicies
{
    public const string AdminOnly = "AdminOnly";
    public const string TeacherOnly = "TeacherOnly";
    public const string StudentOnly = "StudentOnly";
    public const string TeacherOrAdmin = "TeacherOrAdmin";

    public static void Configure(AuthorizationOptions options)
    {
        options.AddPolicy(AdminOnly, p => p.RequireRole("Admin"));
        options.AddPolicy(TeacherOnly, p => p.RequireRole("Teacher"));
        options.AddPolicy(StudentOnly, p => p.RequireRole("Student"));
        options.AddPolicy(TeacherOrAdmin, p => p.RequireRole("Teacher", "Admin"));
    }
}
