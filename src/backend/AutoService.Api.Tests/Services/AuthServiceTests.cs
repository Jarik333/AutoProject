using AutoService.Api.Models;
using AutoService.Api.Services;
using AutoService.Api.Tests.TestInfrastructure;
using AutoService.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace AutoService.Api.Tests.Services;

public class AuthServiceTests
{
    [Fact]
    public async Task RegisterTenantAsync_ShouldReturnNull_WhenSlugAlreadyExists()
    {
        await using var db = TestDbContextFactory.Create();
        db.Tenants.Add(new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Existing Tenant",
            Slug = "existing",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateAuthService(db);

        var result = await service.RegisterTenantAsync(
            new RegisterTenantRequest
            {
                TenantName = "New Tenant",
                Slug = " Existing ",
                Email = "new@test.local",
                Password = "Secret123!",
                FullName = "Owner"
            },
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task RegisterTenantAsync_ShouldReturnNull_WhenEmailAlreadyExists()
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
            Email = "existing@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
            FullName = "Existing User",
            Role = UserRole.Owner,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateAuthService(db);

        var result = await service.RegisterTenantAsync(
            new RegisterTenantRequest
            {
                TenantName = "Another Tenant",
                Slug = "another",
                Email = " Existing@Test.Local ",
                Password = "Secret123!",
                FullName = "Owner"
            },
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task RegisterTenantAsync_ShouldCreateTenantAndUser_WhenRequestIsValid()
    {
        await using var db = TestDbContextFactory.Create();
        var service = CreateAuthService(db);

        var result = await service.RegisterTenantAsync(
            new RegisterTenantRequest
            {
                TenantName = "My Service",
                Slug = "my-service",
                Email = "owner@test.local",
                Password = "Secret123!",
                FullName = "Service Owner"
            },
            CancellationToken.None);

        result.Should().NotBeNull();
        db.Tenants.Should().ContainSingle(t => t.Slug == "my-service");
        db.Users.Should().ContainSingle(u => u.Email == "owner@test.local");

        var createdUser = db.Users.Single();
        createdUser.PasswordHash.Should().NotBe("Secret123!");
        BCrypt.Net.BCrypt.Verify("Secret123!", createdUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnNull_WhenUserDoesNotExist()
    {
        await using var db = TestDbContextFactory.Create();
        var service = CreateAuthService(db);

        var result = await service.LoginAsync(
            new LoginRequest
            {
                Email = "missing@test.local",
                Password = "Secret123!"
            },
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnNull_WhenPasswordIsInvalid()
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
            FullName = "User",
            Role = UserRole.Owner,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateAuthService(db);

        var result = await service.LoginAsync(
            new LoginRequest
            {
                Email = "user@test.local",
                Password = "WrongPassword"
            },
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnAuthResponse_WhenCredentialsAreValid()
    {
        await using var db = TestDbContextFactory.Create();
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Tenant Name",
            Slug = "tenant",
            CreatedAt = DateTime.UtcNow
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = "user@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("RightPassword"),
            FullName = "User Name",
            Role = UserRole.Owner,
            CreatedAt = DateTime.UtcNow
        };

        db.Tenants.Add(tenant);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = CreateAuthService(db);

        var result = await service.LoginAsync(
            new LoginRequest
            {
                Email = " user@test.local ",
                Password = "RightPassword"
            },
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.Email.Should().Be("user@test.local");
        result.TenantId.Should().Be(tenant.Id);
        result.UserId.Should().Be(user.Id);
        result.Token.Should().NotBeNullOrWhiteSpace();
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
