namespace AssignmentSystem.Api.Entities;

public class Class
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<TeacherAssignment> TeacherAssignments { get; set; } = new List<TeacherAssignment>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
