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
    public DbSet<ClientVehicle> ClientVehicles => Set<ClientVehicle>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<WorkOrderLine> WorkOrderLines => Set<WorkOrderLine>();
    public DbSet<Appointment> Appointments => Set<Appointment>();

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
            e.HasMany(x => x.Vehicles).WithOne(v => v.Client).HasForeignKey(v => v.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClientVehicle>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Make).HasMaxLength(100);
            e.Property(x => x.Model).HasMaxLength(100);
            e.Property(x => x.LicensePlate).HasMaxLength(20);
            e.Property(x => x.Vin).HasMaxLength(17);
        });

        modelBuilder.Entity<WorkOrder>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Number }).IsUnique();
            e.Property(x => x.Description).HasMaxLength(4000);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId);
            e.HasOne(x => x.Client).WithMany(c => c.WorkOrders).HasForeignKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ClientVehicle).WithMany(v => v.WorkOrders).HasForeignKey(x => x.ClientVehicleId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Lines).WithOne(l => l.WorkOrder).HasForeignKey(l => l.WorkOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkOrderLine>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(500);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Quantity).HasPrecision(12, 3);
            e.Property(x => x.UnitPrice).HasPrecision(12, 2);
        });

        modelBuilder.Entity<Appointment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.StartsAt });
            e.HasIndex(x => x.WorkOrderId).IsUnique();
            e.Property(x => x.Notes).HasMaxLength(2000);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId);
            e.HasOne(x => x.Client).WithMany(c => c.Appointments).HasForeignKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ClientVehicle).WithMany(v => v.Appointments).HasForeignKey(x => x.ClientVehicleId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.WorkOrder).WithOne(w => w.Appointment).HasForeignKey<Appointment>(x => x.WorkOrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Client>().HasQueryFilter(e =>
            _tenantProvider.TenantId == null || e.TenantId == _tenantProvider.TenantId);

        modelBuilder.Entity<WorkOrder>().HasQueryFilter(e =>
            _tenantProvider.TenantId == null || e.TenantId == _tenantProvider.TenantId);

        modelBuilder.Entity<Appointment>().HasQueryFilter(e =>
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
