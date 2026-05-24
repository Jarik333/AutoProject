using AutoService.Domain.Common;

namespace AutoService.Domain.Entities;

public class Appointment : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ClientId { get; set; }
    public Guid? ClientVehicleId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public AppointmentStatus Status { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public Client Client { get; set; } = null!;
    public ClientVehicle? ClientVehicle { get; set; }
    public WorkOrder? WorkOrder { get; set; }
}
