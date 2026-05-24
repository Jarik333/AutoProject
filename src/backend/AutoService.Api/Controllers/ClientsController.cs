using AutoService.Api.Models;

using AutoService.Domain.Entities;

using AutoService.Infrastructure.Persistence;

using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;



namespace AutoService.Api.Controllers;



[ApiController]

[Authorize]

[Route("api/[controller]")]

public class ClientsController(AppDbContext db) : ControllerBase

{

    [HttpGet]

    public async Task<ActionResult<IEnumerable<ClientDto>>> GetAll(CancellationToken ct)

    {

        var clients = await db.Clients

            .AsNoTracking()

            .Include(c => c.Vehicles)

            .OrderByDescending(c => c.CreatedAt)

            .ToListAsync(ct);



        return Ok(clients.Select(ToDto));

    }



    [HttpGet("{id:guid}")]

    public async Task<ActionResult<ClientDto>> GetById(Guid id, CancellationToken ct)

    {

        var client = await db.Clients

            .AsNoTracking()

            .Include(c => c.Vehicles)

            .FirstOrDefaultAsync(c => c.Id == id, ct);



        if (client is null)

            return NotFound();



        return Ok(ToDto(client));

    }



    [HttpPost]

    public async Task<ActionResult<ClientDto>> Create(CreateClientRequest request, CancellationToken ct)

    {

        var client = new Client

        {

            Id = Guid.NewGuid(),

            FullName = request.FullName.Trim(),

            Phone = request.Phone.Trim(),

            Email = request.Email?.Trim(),

            Notes = request.Notes?.Trim(),

            CreatedAt = DateTime.UtcNow

        };



        foreach (var vehicleRequest in request.Vehicles ?? [])

            client.Vehicles.Add(MapVehicle(vehicleRequest, client.Id));



        db.Clients.Add(client);

        await db.SaveChangesAsync(ct);



        var saved = await db.Clients

            .AsNoTracking()

            .Include(c => c.Vehicles)

            .FirstAsync(c => c.Id == client.Id, ct);



        return CreatedAtAction(nameof(GetById), new { id = client.Id }, ToDto(saved));

    }



    [HttpPut("{id:guid}")]

    public async Task<ActionResult<ClientDto>> Update(Guid id, UpdateClientRequest request, CancellationToken ct)

    {

        var client = await db.Clients

            .Include(c => c.Vehicles)

            .FirstOrDefaultAsync(c => c.Id == id, ct);



        if (client is null)

            return NotFound();



        client.FullName = request.FullName.Trim();

        client.Phone = request.Phone.Trim();

        client.Email = request.Email?.Trim();

        client.Notes = request.Notes?.Trim();



        SyncVehicles(client, request.Vehicles ?? []);



        await db.SaveChangesAsync(ct);



        var saved = await db.Clients

            .AsNoTracking()

            .Include(c => c.Vehicles)

            .FirstAsync(c => c.Id == client.Id, ct);



        return Ok(ToDto(saved));

    }



    [HttpDelete("{id:guid}")]

    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)

    {

        var client = await db.Clients.FindAsync([id], ct);

        if (client is null)

            return NotFound();



        db.Clients.Remove(client);

        await db.SaveChangesAsync(ct);

        return NoContent();

    }



    private void SyncVehicles(Client client, IReadOnlyList<ClientVehicleRequest> requests)

    {

        var requestIds = requests

            .Where(v => v.Id.HasValue)

            .Select(v => v.Id!.Value)

            .ToHashSet();



        foreach (var removed in client.Vehicles.Where(v => !requestIds.Contains(v.Id)).ToList())

            db.ClientVehicles.Remove(removed);



        foreach (var request in requests)

        {

            if (request.Id.HasValue)

            {

                var existing = client.Vehicles.FirstOrDefault(v => v.Id == request.Id.Value);

                if (existing is not null)

                {

                    ApplyVehicle(existing, request);

                    continue;

                }

            }



            db.ClientVehicles.Add(MapVehicle(request, client.Id));

        }

    }



    private static ClientVehicle MapVehicle(ClientVehicleRequest request, Guid clientId) =>

        ApplyVehicle(new ClientVehicle { Id = Guid.NewGuid(), ClientId = clientId }, request);



    private static ClientVehicle ApplyVehicle(ClientVehicle vehicle, ClientVehicleRequest request)

    {

        vehicle.Make = request.Make.Trim();

        vehicle.Model = request.Model.Trim();

        vehicle.Year = request.Year;

        vehicle.LicensePlate = request.LicensePlate?.Trim();

        vehicle.Vin = request.Vin?.Trim();

        vehicle.Notes = request.Notes?.Trim();

        return vehicle;

    }



    private static ClientDto ToDto(Client c) =>

        new(

            c.Id,

            c.FullName,

            c.Phone,

            c.Email,

            c.Notes,

            c.CreatedAt,

            c.Vehicles

                .OrderBy(v => v.Make)

                .ThenBy(v => v.Model)

                .Select(v => new ClientVehicleDto(

                    v.Id,

                    v.Make,

                    v.Model,

                    v.Year,

                    v.LicensePlate,

                    v.Vin,

                    v.Notes))

                .ToList());

}


