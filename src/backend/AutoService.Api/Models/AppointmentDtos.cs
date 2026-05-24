using System.ComponentModel.DataAnnotations;
using AutoService.Domain.Entities;

namespace AutoService.Api.Models;

public record AppointmentDto(
    Guid Id,
    Guid ClientId,
    string ClientName,
    Guid? ClientVehicleId,
    string? VehicleLabel,
    AppointmentStatus Status,
    DateTime StartsAt,
    DateTime EndsAt,
    string? Notes,
    Guid? WorkOrderId,
    string? WorkOrderDisplayNumber,
    DateTime CreatedAt);

public class CreateAppointmentRequest
{
    [Required]
    public Guid ClientId { get; set; }

    public Guid? ClientVehicleId { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;

    [Required]
    public DateTime StartsAt { get; set; }

    [Required]
    public DateTime EndsAt { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

public class UpdateAppointmentRequest
{
    [Required]
    public Guid ClientId { get; set; }

    public Guid? ClientVehicleId { get; set; }

    public AppointmentStatus Status { get; set; }

    [Required]
    public DateTime StartsAt { get; set; }

    [Required]
    public DateTime EndsAt { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}
