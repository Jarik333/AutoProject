using AutoService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoService.Api.Services;

public static class ClientVehicleValidation
{
    public static async Task<ActionResult?> ValidateAsync(
        AppDbContext db,
        Guid clientId,
        Guid? clientVehicleId,
        CancellationToken ct)
    {
        var clientExists = await db.Clients.AnyAsync(c => c.Id == clientId, ct);
        if (!clientExists)
            return new BadRequestObjectResult(new { message = "Клиент не найден." });

        if (!clientVehicleId.HasValue)
            return null;

        var vehicleValid = await db.ClientVehicles
            .AnyAsync(v => v.Id == clientVehicleId.Value && v.ClientId == clientId, ct);

        if (!vehicleValid)
            return new BadRequestObjectResult(new { message = "Автомобиль не принадлежит выбранному клиенту." });

        return null;
    }
}
