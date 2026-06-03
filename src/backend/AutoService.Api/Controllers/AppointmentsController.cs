using AutoService.Api.Models;
using AutoService.Api.Services;
using AutoService.Domain.Entities;
using AutoService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoService.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AppointmentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetRange(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        CancellationToken ct)
    {
        if (from >= to)
            return BadRequest(new { message = "Параметр from должен быть раньше to." });

        var appointments = await QueryWithIncludes()
            .Where(a => a.StartsAt < to && a.EndsAt > from)
            .OrderBy(a => a.StartsAt)
            .ToListAsync(ct);

        return Ok(appointments.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AppointmentDto>> GetById(Guid id, CancellationToken ct)
    {
        var appointment = await QueryWithIncludes()
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        return Ok(ToDto(appointment));
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> Create(CreateAppointmentRequest request, CancellationToken ct)
    {
        var validationError = await ValidateRequestAsync(request.ClientId, request.ClientVehicleId,
            request.StartsAt, request.EndsAt, ct);
        if (validationError is not null)
            return validationError;

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            ClientId = request.ClientId,
            ClientVehicleId = request.ClientVehicleId,
            Status = request.Status,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            Notes = request.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.Appointments.Add(appointment);
        await db.SaveChangesAsync(ct);

        var saved = await QueryWithIncludes()
            .FirstAsync(a => a.Id == appointment.Id, ct);

        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, ToDto(saved));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AppointmentDto>> Update(Guid id, UpdateAppointmentRequest request, CancellationToken ct)
    {
        var appointment = await db.Appointments
            .Include(a => a.Client)
            .Include(a => a.ClientVehicle)
            .Include(a => a.WorkOrder)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        var validationError = await ValidateRequestAsync(request.ClientId, request.ClientVehicleId,
            request.StartsAt, request.EndsAt, ct);
        if (validationError is not null)
            return validationError;

        appointment.ClientId = request.ClientId;
        appointment.ClientVehicleId = request.ClientVehicleId;
        appointment.Status = request.Status;
        appointment.StartsAt = request.StartsAt;
        appointment.EndsAt = request.EndsAt;
        appointment.Notes = request.Notes?.Trim();

        await db.SaveChangesAsync(ct);

        var saved = await QueryWithIncludes()
            .FirstAsync(a => a.Id == appointment.Id, ct);

        return Ok(ToDto(saved));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var appointment = await db.Appointments.FindAsync([id], ct);
        if (appointment is null)
            return NotFound();

        db.Appointments.Remove(appointment);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/work-order")]
    public async Task<ActionResult<AppointmentDto>> CreateWorkOrder(Guid id, CancellationToken ct)
    {
        var appointment = await db.Appointments
            .Include(a => a.Client)
            .Include(a => a.ClientVehicle)
            .Include(a => a.WorkOrder)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        if (appointment.WorkOrderId.HasValue)
        {
            return Conflict(new
            {
                message = "Для этой записи уже создан заказ-наряд.",
                workOrderId = appointment.WorkOrderId,
                workOrderDisplayNumber = appointment.WorkOrder is null
                    ? null
                    : FormatDisplayNumber(appointment.WorkOrder.Number)
            });
        }

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var nextNumber = await db.WorkOrders.MaxAsync(w => (int?)w.Number, ct) ?? 0;
        nextNumber++;

        var order = new WorkOrder
        {
            Id = Guid.NewGuid(),
            Number = nextNumber,
            ClientId = appointment.ClientId,
            ClientVehicleId = appointment.ClientVehicleId,
            Status = WorkOrderStatus.Draft,
            OpenedAt = appointment.StartsAt,
            Description = appointment.Notes,
            CreatedAt = DateTime.UtcNow
        };

        db.WorkOrders.Add(order);
        appointment.WorkOrderId = order.Id;

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var saved = await QueryWithIncludes()
            .FirstAsync(a => a.Id == appointment.Id, ct);

        return Ok(ToDto(saved));
    }

    private IQueryable<Appointment> QueryWithIncludes() =>
        db.Appointments
            .AsNoTracking()
            .Include(a => a.Client)
            .Include(a => a.ClientVehicle)
            .Include(a => a.WorkOrder);

    private async Task<ActionResult?> ValidateRequestAsync(
        Guid clientId,
        Guid? clientVehicleId,
        DateTime startsAt,
        DateTime endsAt,
        CancellationToken ct)
    {
        if (endsAt <= startsAt)
            return BadRequest(new { message = "Время окончания должно быть позже начала." });

        return await ClientVehicleValidation.ValidateAsync(db, clientId, clientVehicleId, ct);
    }

    private static AppointmentDto ToDto(Appointment a) =>
        new(
            a.Id,
            a.ClientId,
            a.Client.FullName,
            a.ClientVehicleId,
            a.ClientVehicle is null ? null : VehicleLabel(a.ClientVehicle),
            a.Status,
            a.StartsAt,
            a.EndsAt,
            a.Notes,
            a.WorkOrderId,
            a.WorkOrder is null ? null : FormatDisplayNumber(a.WorkOrder.Number),
            a.CreatedAt);

    private static string FormatDisplayNumber(int number) => $"ЗН-{number:D4}";

    private static string VehicleLabel(ClientVehicle v)
    {
        var parts = new List<string> { $"{v.Make} {v.Model}".Trim() };
        if (v.Year.HasValue)
            parts.Add(v.Year.Value.ToString());
        if (!string.IsNullOrWhiteSpace(v.LicensePlate))
            parts.Add(v.LicensePlate);
        return string.Join(" · ", parts);
    }
}
