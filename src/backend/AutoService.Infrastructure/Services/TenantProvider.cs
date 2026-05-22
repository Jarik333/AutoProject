namespace AutoService.Infrastructure.Services;

public class TenantProvider : ITenantProvider
{
    public Guid? TenantId { get; private set; }
    public Guid? UserId { get; private set; }

    public void Set(Guid tenantId, Guid userId)
    {
        TenantId = tenantId;
        UserId = userId;
    }
}
