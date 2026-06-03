using System.Net;
using System.Net.Http.Json;
using AutoService.Api.Models;
using AutoService.Api.Tests.TestInfrastructure;
using FluentAssertions;

namespace AutoService.Api.Tests.Integration;

[Collection("Integration")]
public class AuthIntegrationTests(IntegrationTestWebApplicationFactory factory)
{
    [Fact]
    public async Task RegisterTenant_ShouldAllowLoginAndAccessProtectedEndpoint()
    {
        var slug = $"garage-{Guid.NewGuid():N}"[..20];
        var email = $"owner-{Guid.NewGuid():N}@test.local";

        var client = factory.CreateClient();

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register-tenant", new RegisterTenantRequest
        {
            TenantName = "Integration Garage",
            Slug = slug,
            Email = email,
            Password = IntegrationTestSeed.Password,
            FullName = "Integration Owner"
        });

        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var registered = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();
        registered.Should().NotBeNull();
        registered!.Email.Should().Be(email.ToLowerInvariant());

        var loginClient = factory.CreateClient();
        await IntegrationTestClientFactory.CreateAuthenticatedClientAsync(
            loginClient,
            email,
            IntegrationTestSeed.Password);

        var clientsResponse = await loginClient.GetAsync("/api/clients");
        clientsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var clients = await clientsResponse.Content.ReadFromJsonAsync<List<ClientDto>>();
        clients.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenPasswordIsWrong()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = factory.SeedData.TenantAEmail,
            Password = "WrongPassword!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_ShouldReturnUnauthorized_WithoutToken()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/clients");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
