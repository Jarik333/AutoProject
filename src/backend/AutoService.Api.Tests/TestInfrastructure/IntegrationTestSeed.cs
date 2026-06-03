using AutoService.Domain.Entities;
using AutoService.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace AutoService.Api.Tests.TestInfrastructure;

public static class IntegrationTestSeed
{
    public const string Password = "TestPass123!";

    public static async Task<SeededTenants> SeedTwoTenantsAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenantAId = Guid.NewGuid();
        var tenantBId = Guid.NewGuid();
        var clientAId = Guid.NewGuid();
        var clientBId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        db.Tenants.AddRange(
            new Tenant
            {
                Id = tenantAId,
                Name = "Garage Alpha",
                Slug = "garage-alpha",
                CreatedAt = now
            },
            new Tenant
            {
                Id = tenantBId,
                Name = "Garage Beta",
                Slug = "garage-beta",
                CreatedAt = now
            });

        db.Users.AddRange(
            new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantAId,
                Email = "owner-a@test.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Password),
                FullName = "Owner A",
                Role = UserRole.Owner,
                CreatedAt = now
            },
            new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantBId,
                Email = "owner-b@test.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Password),
                FullName = "Owner B",
                Role = UserRole.Owner,
                CreatedAt = now
            });

        db.Clients.AddRange(
            new Client
            {
                Id = clientAId,
                TenantId = tenantAId,
                FullName = "Client Alpha",
                Phone = "+70000000001",
                CreatedAt = now
            },
            new Client
            {
                Id = clientBId,
                TenantId = tenantBId,
                FullName = "Client Beta",
                Phone = "+70000000002",
                CreatedAt = now
            });

        await db.SaveChangesAsync();

        return new SeededTenants(
            tenantAId,
            tenantBId,
            clientAId,
            clientBId,
            "owner-a@test.local",
            "owner-b@test.local",
            Password);
    }
}
