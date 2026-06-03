using System.Net;
using System.Net.Http.Json;
using AutoService.Api.Models;
using AutoService.Api.Tests.TestInfrastructure;
using FluentAssertions;

namespace AutoService.Api.Tests.Integration;

[Collection("Integration")]
public class TenantIsolationTests(IntegrationTestWebApplicationFactory factory)
{
    [Fact]
    public async Task GetClients_ShouldReturnOnlyOwnTenantData()
    {
        var client = factory.CreateClient();
        await IntegrationTestClientFactory.CreateAuthenticatedClientAsync(
            client,
            factory.SeedData.TenantAEmail,
            factory.SeedData.Password);

        var response = await client.GetAsync("/api/clients");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var clients = await response.Content.ReadFromJsonAsync<List<ClientDto>>();
        clients.Should().NotBeNull();
        clients!.Should().ContainSingle(c => c.Id == factory.SeedData.ClientAId);
        clients.Should().NotContain(c => c.Id == factory.SeedData.ClientBId);
    }

    [Fact]
    public async Task GetClientById_ShouldReturnNotFound_ForOtherTenantClient()
    {
        var client = factory.CreateClient();
        await IntegrationTestClientFactory.CreateAuthenticatedClientAsync(
            client,
            factory.SeedData.TenantAEmail,
            factory.SeedData.Password);

        var response = await client.GetAsync($"/api/clients/{factory.SeedData.ClientBId}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateClient_ShouldReturnNotFound_ForOtherTenantClient()
    {
        var client = factory.CreateClient();
        await IntegrationTestClientFactory.CreateAuthenticatedClientAsync(
            client,
            factory.SeedData.TenantAEmail,
            factory.SeedData.Password);

        var response = await client.PutAsJsonAsync(
            $"/api/clients/{factory.SeedData.ClientBId}",
            new UpdateClientRequest
            {
                FullName = "Hacked Name",
                Phone = "+79999999999"
            });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteClient_ShouldReturnNotFound_ForOtherTenantClient()
    {
        var client = factory.CreateClient();
        await IntegrationTestClientFactory.CreateAuthenticatedClientAsync(
            client,
            factory.SeedData.TenantAEmail,
            factory.SeedData.Password);

        var response = await client.DeleteAsync($"/api/clients/{factory.SeedData.ClientBId}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateClient_ShouldAssignCurrentTenant_NotOtherTenant()
    {
        var client = factory.CreateClient();
        await IntegrationTestClientFactory.CreateAuthenticatedClientAsync(
            client,
            factory.SeedData.TenantBEmail,
            factory.SeedData.Password);

        var createResponse = await client.PostAsJsonAsync("/api/clients", new CreateClientRequest
        {
            FullName = "New Client B",
            Phone = "+70000000099"
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<ClientDto>();
        created.Should().NotBeNull();

        var listResponse = await client.GetAsync("/api/clients");
        var clients = await listResponse.Content.ReadFromJsonAsync<List<ClientDto>>();

        clients.Should().NotBeNull();
        clients!.Should().Contain(c => c.Id == created!.Id);
        clients.Should().NotContain(c => c.Id == factory.SeedData.ClientAId);
    }

    [Fact]
    public async Task TenantB_ShouldNotSeeTenantAClients()
    {
        var client = factory.CreateClient();
        await IntegrationTestClientFactory.CreateAuthenticatedClientAsync(
            client,
            factory.SeedData.TenantBEmail,
            factory.SeedData.Password);

        var response = await client.GetAsync("/api/clients");
        var clients = await response.Content.ReadFromJsonAsync<List<ClientDto>>();

        clients.Should().NotBeNull();
        clients!.Should().ContainSingle(c => c.Id == factory.SeedData.ClientBId);
        clients.Should().NotContain(c => c.Id == factory.SeedData.ClientAId);
    }
}
