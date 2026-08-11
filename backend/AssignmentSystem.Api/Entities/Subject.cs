namespace AssignmentSystem.Api.Entities;

public class Subject
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<TeacherAssignment> TeacherAssignments { get; set; } = new List<TeacherAssignment>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
