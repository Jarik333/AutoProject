using AutoService.Domain.Common;

namespace AutoService.Domain.Entities;

public class WorkOrder : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public int Number { get; set; }
    public Guid ClientId { get; set; }
    public Guid? ClientVehicleId { get; set; }
    public WorkOrderStatus Status { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public Client Client { get; set; } = null!;
    public ClientVehicle? ClientVehicle { get; set; }
    public ICollection<WorkOrderLine> Lines { get; set; } = [];
}
