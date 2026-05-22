namespace AutoService.Domain.Entities;

public enum UserRole
{
    Owner = 0,
    Manager = 1,
    Mechanic = 2,
    Receptionist = 3
}

public class User
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
