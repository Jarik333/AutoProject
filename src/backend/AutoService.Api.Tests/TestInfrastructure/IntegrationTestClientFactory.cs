using System.Net.Http.Headers;
using System.Net.Http.Json;
using AutoService.Api.Models;

namespace AutoService.Api.Tests.TestInfrastructure;

public static class IntegrationTestClientFactory
{
    public static async Task<HttpClient> CreateAuthenticatedClientAsync(
        HttpClient client,
        string email,
        string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });

        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>()
                   ?? throw new InvalidOperationException("Login response was empty.");

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.Token);

        return client;
    }
}
