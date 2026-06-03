namespace AutoService.Api.Tests.TestInfrastructure;

public sealed record SeededTenants(
    Guid TenantAId,
    Guid TenantBId,
    Guid ClientAId,
    Guid ClientBId,
    string TenantAEmail,
    string TenantBEmail,
    string Password);
