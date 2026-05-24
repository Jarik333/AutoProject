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
public class WorkOrdersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkOrderDto>>> GetAll(CancellationToken ct)
    {
        var orders = await QueryWithIncludes()
            .OrderByDescending(w => w.OpenedAt)
            .ThenByDescending(w => w.Number)
            .ToListAsync(ct);

        return Ok(orders.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkOrderDto>> GetById(Guid id, CancellationToken ct)
    {
        var order = await QueryWithIncludes()
            .FirstOrDefaultAsync(w => w.Id == id, ct);

        if (order is null)
            return NotFound();

        return Ok(ToDto(order));
    }

    [HttpPost]
    public async Task<ActionResult<WorkOrderDto>> Create(CreateWorkOrderRequest request, CancellationToken ct)
    {
        var validationError = await ClientVehicleValidation.ValidateAsync(db, request.ClientId, request.ClientVehicleId, ct);
        if (validationError is not null)
            return validationError;

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var nextNumber = await db.WorkOrders.MaxAsync(w => (int?)w.Number, ct) ?? 0;
        nextNumber++;

        var order = new WorkOrder
        {
            Id = Guid.NewGuid(),
            Number = nextNumber,
            ClientId = request.ClientId,
            ClientVehicleId = request.ClientVehicleId,
            Status = request.Status,
            OpenedAt = request.OpenedAt ?? DateTime.UtcNow,
            Description = request.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        ApplyClosedAt(order);

        foreach (var lineRequest in request.Lines ?? [])
            order.Lines.Add(MapLine(lineRequest, order.Id));

        db.WorkOrders.Add(order);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var saved = await QueryWithIncludes()
            .FirstAsync(w => w.Id == order.Id, ct);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToDto(saved));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<WorkOrderDto>> Update(Guid id, UpdateWorkOrderRequest request, CancellationToken ct)
    {
        var order = await db.WorkOrders
            .Include(w => w.Lines)
            .Include(w => w.Client)
            .Include(w => w.ClientVehicle)
            .FirstOrDefaultAsync(w => w.Id == id, ct);

        if (order is null)
            return NotFound();

        var validationError = await ClientVehicleValidation.ValidateAsync(db, request.ClientId, request.ClientVehicleId, ct);
        if (validationError is not null)
            return validationError;

        order.ClientId = request.ClientId;
        order.ClientVehicleId = request.ClientVehicleId;
        order.Status = request.Status;
        if (request.OpenedAt.HasValue)
            order.OpenedAt = request.OpenedAt.Value;
        order.Description = request.Description?.Trim();

        ApplyClosedAt(order);
        SyncLines(order, request.Lines ?? []);

        await db.SaveChangesAsync(ct);

        var saved = await QueryWithIncludes()
            .FirstAsync(w => w.Id == order.Id, ct);

        return Ok(ToDto(saved));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var order = await db.WorkOrders.FindAsync([id], ct);
        if (order is null)
            return NotFound();

        db.WorkOrders.Remove(order);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private IQueryable<WorkOrder> QueryWithIncludes() =>
        db.WorkOrders
            .AsNoTracking()
            .Include(w => w.Client)
            .Include(w => w.ClientVehicle)
            .Include(w => w.Lines);

    private static void ApplyClosedAt(WorkOrder order)
    {
        order.ClosedAt = order.Status == WorkOrderStatus.Done
            ? order.ClosedAt ?? DateTime.UtcNow
            : null;
    }

    private void SyncLines(WorkOrder order, IReadOnlyList<WorkOrderLineRequest> requests)
    {
        var requestIds = requests
            .Where(l => l.Id.HasValue)
            .Select(l => l.Id!.Value)
            .ToHashSet();

        foreach (var removed in order.Lines.Where(l => !requestIds.Contains(l.Id)).ToList())
            db.WorkOrderLines.Remove(removed);

        foreach (var request in requests)
        {
            if (request.Id.HasValue)
            {
                var existing = order.Lines.FirstOrDefault(l => l.Id == request.Id.Value);
                if (existing is not null)
                {
                    ApplyLine(existing, request);
                    continue;
                }
            }

            db.WorkOrderLines.Add(MapLine(request, order.Id));
        }
    }

    private static WorkOrderLine MapLine(WorkOrderLineRequest request, Guid workOrderId) =>
        ApplyLine(new WorkOrderLine { Id = Guid.NewGuid(), WorkOrderId = workOrderId }, request);

    private static WorkOrderLine ApplyLine(WorkOrderLine line, WorkOrderLineRequest request)
    {
        line.Type = request.Type;
        line.Name = request.Name.Trim();
        line.Quantity = request.Quantity;
        line.UnitPrice = request.UnitPrice;
        return line;
    }

    private static WorkOrderDto ToDto(WorkOrder w)
    {
        var lines = w.Lines
            .OrderBy(l => l.Name)
            .Select(l => new WorkOrderLineDto(
                l.Id,
                l.Type,
                l.Name,
                l.Quantity,
                l.UnitPrice,
                l.Quantity * l.UnitPrice))
            .ToList();

        return new WorkOrderDto(
            w.Id,
            w.Number,
            FormatDisplayNumber(w.Number),
            w.ClientId,
            w.Client.FullName,
            w.ClientVehicleId,
            w.ClientVehicle is null ? null : VehicleLabel(w.ClientVehicle),
            w.Status,
            w.OpenedAt,
            w.ClosedAt,
            w.Description,
            w.CreatedAt,
            lines.Sum(l => l.LineTotal),
            lines);
    }

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
