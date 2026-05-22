using AutoService.Api.Models;
using AutoService.Domain.Entities;
using AutoService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AutoService.Api.Services;

public class AuthService(AppDbContext db, JwtTokenService jwt)
{
    public async Task<AuthResponse?> RegisterTenantAsync(RegisterTenantRequest request, CancellationToken ct)
    {
        var slug = request.Slug.Trim().ToLowerInvariant();
        if (await db.Tenants.AnyAsync(t => t.Slug == slug, ct))
            return null;

        if (await db.Users.AnyAsync(u => u.Email == request.Email.Trim().ToLowerInvariant(), ct))
            return null;

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.TenantName.Trim(),
            Slug = slug,
            CreatedAt = DateTime.UtcNow
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Role = UserRole.Owner,
            CreatedAt = DateTime.UtcNow
        };

        db.Tenants.Add(tenant);
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return new AuthResponse(
            jwt.CreateToken(user, tenant),
            tenant.Id,
            tenant.Name,
            user.Id,
            user.Email,
            user.FullName);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        return new AuthResponse(
            jwt.CreateToken(user, user.Tenant),
            user.TenantId,
            user.Tenant.Name,
            user.Id,
            user.Email,
            user.FullName);
    }
}
