using AutoService.Api.Observability;
using AutoService.Api.Models;
using AutoService.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AutoService.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService auth) : ControllerBase
{
    [HttpPost("register-tenant")]
    public async Task<ActionResult<AuthResponse>> RegisterTenant([FromBody] RegisterTenantRequest request, CancellationToken ct)
    {
        var result = await auth.RegisterTenantAsync(request, ct);
        if (result is null)
        {
            AppMetrics.TenantRegistrations.WithLabels("conflict").Inc();
            return Conflict(new { message = "Сервис с таким slug или email уже существует." });
        }

        AppMetrics.TenantRegistrations.WithLabels("success").Inc();
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await auth.LoginAsync(request, ct);
        if (result is null)
        {
            AppMetrics.LoginAttempts.WithLabels("failure").Inc();
            return Unauthorized(new { message = "Неверный email или пароль." });
        }

        AppMetrics.LoginAttempts.WithLabels("success").Inc();
        return Ok(result);
    }
}
