namespace AssignmentSystem.Api.Entities;

public enum AssignmentStatus
{
    Draft,
    Published
}

public class Assignment
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTime Deadline { get; set; }
    public int MaxMarks { get; set; }
    public AssignmentStatus Status { get; set; }
    public int TeacherId { get; set; }
    public Teacher Teacher { get; set; } = null!;
    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;
    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
