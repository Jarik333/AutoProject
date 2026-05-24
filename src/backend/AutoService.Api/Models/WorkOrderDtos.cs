using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using AutoService.Domain.Entities;

namespace AutoService.Api.Models;

public record WorkOrderLineDto(
    Guid Id,
    WorkOrderLineType Type,
    string Name,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public record WorkOrderDto(
    Guid Id,
    int Number,
    string DisplayNumber,
    Guid ClientId,
    string ClientName,
    Guid? ClientVehicleId,
    string? VehicleLabel,
    WorkOrderStatus Status,
    DateTime OpenedAt,
    DateTime? ClosedAt,
    string? Description,
    DateTime CreatedAt,
    decimal Total,
    IReadOnlyList<WorkOrderLineDto> Lines);

public class WorkOrderLineRequest
{
    public Guid? Id { get; set; }

    [Required]
    public WorkOrderLineType Type { get; set; }

    [Required, MaxLength(500)]
    public string Name { get; set; } = string.Empty;

    [Range(0.001, 999999)]
    public decimal Quantity { get; set; } = 1;

    [Range(0, 999999999)]
    public decimal UnitPrice { get; set; }
}

public class CreateWorkOrderRequest
{
    [Required]
    public Guid ClientId { get; set; }

    public Guid? ClientVehicleId { get; set; }

    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Draft;

    public DateTime? OpenedAt { get; set; }

    [MaxLength(4000)]
    public string? Description { get; set; }

    [JsonPropertyName("lines")]
    public List<WorkOrderLineRequest>? Lines { get; set; }
}

public class UpdateWorkOrderRequest
{
    [Required]
    public Guid ClientId { get; set; }

    public Guid? ClientVehicleId { get; set; }

    [Required]
    public WorkOrderStatus Status { get; set; }

    public DateTime? OpenedAt { get; set; }

    [MaxLength(4000)]
    public string? Description { get; set; }

    [JsonPropertyName("lines")]
    public List<WorkOrderLineRequest>? Lines { get; set; }
}
