using AutoService.Api.Controllers;
using AutoService.Api.Models;
using AutoService.Api.Services;
using AutoService.Api.Tests.TestInfrastructure;
using AutoService.Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AutoService.Api.Tests.Controllers;

public class AuthControllerTests
{
    [Fact]
    public async Task RegisterTenant_ShouldReturnConflict_WhenServiceReturnsNull()
    {
        await using var db = TestDbContextFactory.Create();
        db.Tenants.Add(new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Existing",
            Slug = "existing",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = new AuthController(CreateAuthService(db));

        var response = await controller.RegisterTenant(
            new RegisterTenantRequest
            {
                TenantName = "New",
                Slug = "existing",
                Email = "owner@test.local",
                Password = "Secret123!",
                FullName = "Owner"
            },
            CancellationToken.None);

        response.Result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task RegisterTenant_ShouldReturnOk_WhenServiceReturnsAuthResponse()
    {
        await using var db = TestDbContextFactory.Create();
        var controller = new AuthController(CreateAuthService(db));

        var response = await controller.RegisterTenant(
            new RegisterTenantRequest
            {
                TenantName = "My Tenant",
                Slug = "my-tenant",
                Email = "owner@test.local",
                Password = "Secret123!",
                FullName = "Owner"
            },
            CancellationToken.None);

        var okResult = response.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeOfType<AuthResponse>();
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenServiceReturnsNull()
    {
        await using var db = TestDbContextFactory.Create();
        var controller = new AuthController(CreateAuthService(db));

        var response = await controller.Login(
            new LoginRequest
            {
                Email = "missing@test.local",
                Password = "Secret123!"
            },
            CancellationToken.None);

        response.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_ShouldReturnOk_WhenServiceReturnsAuthResponse()
    {
        await using var db = TestDbContextFactory.Create();
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Tenant",
            Slug = "tenant",
            CreatedAt = DateTime.UtcNow
        };

        db.Tenants.Add(tenant);
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = "user@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("RightPassword"),
            FullName = "User Name",
            Role = UserRole.Owner,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = new AuthController(CreateAuthService(db));

        var response = await controller.Login(
            new LoginRequest
            {
                Email = "user@test.local",
                Password = "RightPassword"
            },
            CancellationToken.None);

        var okResult = response.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeOfType<AuthResponse>();
    }

    private static AuthService CreateAuthService(AutoService.Infrastructure.Persistence.AppDbContext db)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "a_very_long_test_secret_key_for_hmac_256",
                ["Jwt:Issuer"] = "AutoService.Tests",
                ["Jwt:Audience"] = "AutoService.Tests.Client"
            })
            .Build();

        return new AuthService(db, new JwtTokenService(configuration));
    }
}
