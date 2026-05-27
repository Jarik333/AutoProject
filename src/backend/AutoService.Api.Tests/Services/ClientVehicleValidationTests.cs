using AutoService.Api.Services;
using AutoService.Domain.Entities;
using AutoService.Api.Tests.TestInfrastructure;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;

namespace AutoService.Api.Tests.Services;

public class ClientVehicleValidationTests
{
    [Fact]
    public async Task ValidateAsync_ShouldReturnBadRequest_WhenClientDoesNotExist()
    {
        await using var db = TestDbContextFactory.Create();

        var result = await ClientVehicleValidation.ValidateAsync(
            db,
            Guid.NewGuid(),
            Guid.NewGuid(),
            CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ValidateAsync_ShouldReturnNull_WhenVehicleIdIsNotProvided()
    {
        await using var db = TestDbContextFactory.Create();
        db.Clients.Add(new Client
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            FullName = "Client",
            Phone = "123",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var clientId = db.Clients.Single().Id;

        var result = await ClientVehicleValidation.ValidateAsync(
            db,
            clientId,
            null,
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ValidateAsync_ShouldReturnBadRequest_WhenVehicleDoesNotBelongToClient()
    {
        await using var db = TestDbContextFactory.Create();

        var client = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            FullName = "Client",
            Phone = "123",
            CreatedAt = DateTime.UtcNow
        };

        var otherClient = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            FullName = "Other",
            Phone = "321",
            CreatedAt = DateTime.UtcNow
        };

        var vehicle = new ClientVehicle
        {
            Id = Guid.NewGuid(),
            ClientId = otherClient.Id,
            Make = "VW",
            Model = "Golf"
        };

        db.Clients.AddRange(client, otherClient);
        db.ClientVehicles.Add(vehicle);
        await db.SaveChangesAsync();

        var result = await ClientVehicleValidation.ValidateAsync(
            db,
            client.Id,
            vehicle.Id,
            CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ValidateAsync_ShouldReturnNull_WhenVehicleBelongsToClient()
    {
        await using var db = TestDbContextFactory.Create();

        var client = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            FullName = "Client",
            Phone = "123",
            CreatedAt = DateTime.UtcNow
        };

        var vehicle = new ClientVehicle
        {
            Id = Guid.NewGuid(),
            ClientId = client.Id,
            Make = "Toyota",
            Model = "Camry"
        };

        db.Clients.Add(client);
        db.ClientVehicles.Add(vehicle);
        await db.SaveChangesAsync();

        var result = await ClientVehicleValidation.ValidateAsync(
            db,
            client.Id,
            vehicle.Id,
            CancellationToken.None);

        result.Should().BeNull();
    }
}
