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
            return Conflict(new { message = "Сервис с таким slug или email уже существует." });

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await auth.LoginAsync(request, ct);
        if (result is null)
            return Unauthorized(new { message = "Неверный email или пароль." });

        return Ok(result);
    }
}
