using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoService.Domain.Entities;
using Microsoft.IdentityModel.Tokens;

namespace AutoService.Api.Services;

public class JwtTokenService(IConfiguration configuration)
{
    public string CreateToken(User user, Tenant tenant)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("tenant_id", tenant.Id.ToString()),
            new Claim("user_id", user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
