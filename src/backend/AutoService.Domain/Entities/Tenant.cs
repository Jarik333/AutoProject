namespace AutoService.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string TimeZone { get; set; } = "Europe/Moscow";
    public DateTime CreatedAt { get; set; }

    public ICollection<User> Users { get; set; } = [];
    public ICollection<Client> Clients { get; set; } = [];
}
