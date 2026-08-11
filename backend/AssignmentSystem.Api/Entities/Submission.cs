namespace AssignmentSystem.Api.Entities;

public enum SubmissionStatus
{
    Submitted,
    Graded,
    Rejected
}

public class Submission
{
    public int Id { get; set; }
    public string Answer { get; set; } = null!;
    public SubmissionStatus Status { get; set; }
    public int? Marks { get; set; }
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
}
