namespace AssignmentSystem.Api.Entities;

public class TeacherAssignment
{
    public int TeacherId { get; set; }
    public Teacher Teacher { get; set; } = null!;
    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;
    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
}
