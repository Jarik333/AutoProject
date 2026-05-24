using AutoService.Domain.Common;

namespace AutoService.Domain.Entities;

public class Client : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public ICollection<ClientVehicle> Vehicles { get; set; } = [];
}
