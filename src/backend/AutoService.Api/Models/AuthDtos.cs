using System.ComponentModel.DataAnnotations;

namespace AutoService.Api.Models;

public class RegisterTenantRequest
{
    [Required, MaxLength(200)]
    public string TenantName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public record AuthResponse(
    string Token,
    Guid TenantId,
    string TenantName,
    Guid UserId,
    string Email,
    string FullName);
