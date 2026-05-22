using AutoService.Domain.Common;
using AutoService.Domain.Entities;
using AutoService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace AutoService.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Slug).HasMaxLength(100);
            e.Property(x => x.TimeZone).HasMaxLength(64);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
            e.Property(x => x.Email).HasMaxLength(256);
            e.Property(x => x.FullName).HasMaxLength(200);
            e.HasOne(x => x.Tenant).WithMany(t => t.Users).HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<Client>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Phone });
            e.Property(x => x.FullName).HasMaxLength(200);
            e.Property(x => x.Phone).HasMaxLength(32);
            e.Property(x => x.Email).HasMaxLength(256);
            e.HasOne(x => x.Tenant).WithMany(t => t.Clients).HasForeignKey(x => x.TenantId);
        });

        modelBuilder.Entity<Client>().HasQueryFilter(e =>
            _tenantProvider.TenantId == null || e.TenantId == _tenantProvider.TenantId);
    }

    public override int SaveChanges()
    {
        SetTenantOnNewEntities();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetTenantOnNewEntities();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetTenantOnNewEntities()
    {
        var tenantId = _tenantProvider.TenantId;
        if (tenantId is null)
            return;

        foreach (var entry in ChangeTracker.Entries<ITenantEntity>()
                     .Where(e => e.State == EntityState.Added))
        {
            entry.Entity.TenantId = tenantId.Value;
        }
    }
}
