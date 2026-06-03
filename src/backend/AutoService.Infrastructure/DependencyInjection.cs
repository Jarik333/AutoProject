using AutoService.Infrastructure.Persistence;
using AutoService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AutoService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<ITenantProvider, TenantProvider>();

        services.AddDbContext<AppDbContext>(options =>
        {
            var testingDatabaseName = configuration["Testing:DatabaseName"];
            if (!string.IsNullOrEmpty(testingDatabaseName))
                options.UseInMemoryDatabase(testingDatabaseName);
            else
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));
        });

        return services;
    }
}
