namespace AssignmentSystem.Api.Dtos;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, string Email, string FullName, string Role);
