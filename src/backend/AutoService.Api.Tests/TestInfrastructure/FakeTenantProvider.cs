using AutoService.Infrastructure.Services;

namespace AutoService.Api.Tests.TestInfrastructure;

public class FakeTenantProvider : ITenantProvider
{
    public Guid? TenantId { get; private set; }
    public Guid? UserId { get; private set; }

    public void Set(Guid tenantId, Guid userId)
    {
        TenantId = tenantId;
        UserId = userId;
    }
}
