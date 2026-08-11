using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Services;

public static class RoleResolver
{
    public static string GetRole(User user) => user switch
    {
        Admin => "Admin",
        Teacher => "Teacher",
        Student => "Student",
        _ => throw new InvalidOperationException($"Unknown user type: {user.GetType().Name}")
    };
}
