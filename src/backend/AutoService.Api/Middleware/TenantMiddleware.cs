using System.Security.Claims;
using AutoService.Infrastructure.Services;

namespace AutoService.Api.Middleware;

public class TenantMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
            var userClaim = context.User.FindFirst("user_id")?.Value
                            ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(tenantClaim, out var tenantId) && Guid.TryParse(userClaim, out var userId))
                tenantProvider.Set(tenantId, userId);
        }

        await next(context);
    }
}
