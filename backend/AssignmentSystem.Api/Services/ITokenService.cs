using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Services;

public interface ITokenService
{
    string CreateToken(User user);
}
