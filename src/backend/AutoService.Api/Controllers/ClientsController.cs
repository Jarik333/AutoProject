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
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClientDto(c.Id, c.FullName, c.Phone, c.Email, c.Notes, c.CreatedAt))
            .ToListAsync(ct);

        return Ok(clients);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientDto>> GetById(Guid id, CancellationToken ct)
    {
        var client = await db.Clients.FindAsync([id], ct);
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

        db.Clients.Add(client);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = client.Id }, ToDto(client));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClientDto>> Update(Guid id, UpdateClientRequest request, CancellationToken ct)
    {
        var client = await db.Clients.FindAsync([id], ct);
        if (client is null)
            return NotFound();

        client.FullName = request.FullName.Trim();
        client.Phone = request.Phone.Trim();
        client.Email = request.Email?.Trim();
        client.Notes = request.Notes?.Trim();

        await db.SaveChangesAsync(ct);
        return Ok(ToDto(client));
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

    private static ClientDto ToDto(Client c) =>
        new(c.Id, c.FullName, c.Phone, c.Email, c.Notes, c.CreatedAt);
}
