namespace AssignmentSystem.Api.Entities;

public class Student : User
{
    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;
}
