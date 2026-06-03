using AutoService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace AutoService.Api.Tests.TestInfrastructure;

public sealed class IntegrationTestWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _databaseName = Guid.NewGuid().ToString();

    public SeededTenants SeedData { get; private set; } = null!;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Testing:DatabaseName"] = _databaseName
            });
        });
    }

    public async Task InitializeAsync()
    {
        SeedData = await IntegrationTestSeed.SeedTwoTenantsAsync(Services);
    }

    public new Task DisposeAsync() => Task.CompletedTask;
}
