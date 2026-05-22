namespace AutoService.Infrastructure.Services;

public interface ITenantProvider
{
    Guid? TenantId { get; }
    Guid? UserId { get; }
    void Set(Guid tenantId, Guid userId);
}
