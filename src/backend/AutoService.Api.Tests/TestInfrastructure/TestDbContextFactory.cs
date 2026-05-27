using AutoService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AutoService.Api.Tests.TestInfrastructure;

public static class TestDbContextFactory
{
    public static AppDbContext Create(FakeTenantProvider? tenantProvider = null)
    {
        tenantProvider ??= new FakeTenantProvider();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options, tenantProvider);
    }
}
