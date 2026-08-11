using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherAssignment> TeacherAssignments => Set<TeacherAssignment>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<User>(u =>
        {
            u.HasDiscriminator<string>("Discriminator")
                .HasValue<Admin>("Admin")
                .HasValue<Teacher>("Teacher")
                .HasValue<Student>("Student");
            u.HasIndex(x => x.Email).IsUnique();
        });

        builder.Entity<Student>(s =>
        {
            s.HasOne(x => x.Class)
                .WithMany(c => c.Students)
                .HasForeignKey(x => x.ClassId);
        });

        builder.Entity<TeacherAssignment>(ta =>
        {
            ta.HasKey(x => new { x.TeacherId, x.ClassId, x.SubjectId });
            ta.HasOne(x => x.Teacher).WithMany().HasForeignKey(x => x.TeacherId);
            ta.HasOne(x => x.Class).WithMany(c => c.TeacherAssignments).HasForeignKey(x => x.ClassId);
            ta.HasOne(x => x.Subject).WithMany(s => s.TeacherAssignments).HasForeignKey(x => x.SubjectId);
        });

        builder.Entity<Assignment>(a =>
        {
            a.HasOne(x => x.Teacher).WithMany().HasForeignKey(x => x.TeacherId);
            a.HasOne(x => x.Class).WithMany(c => c.Assignments).HasForeignKey(x => x.ClassId);
            a.HasOne(x => x.Subject).WithMany(s => s.Assignments).HasForeignKey(x => x.SubjectId);
        });

        builder.Entity<Submission>(s =>
        {
            s.HasIndex(x => new { x.AssignmentId, x.StudentId }).IsUnique();
            s.HasOne(x => x.Assignment).WithMany(a => a.Submissions).HasForeignKey(x => x.AssignmentId);
            s.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId);
        });
    }
}
