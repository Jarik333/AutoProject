using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AutoService.Api.Services;
using AutoService.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace AutoService.Api.Tests.Services;

public class JwtTokenServiceTests
{
    [Fact]
    public void CreateToken_ShouldContainConfiguredIssuerAudienceAndClaims()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "a_very_long_test_secret_key_for_hmac_256",
                ["Jwt:Issuer"] = "AutoService.Tests",
                ["Jwt:Audience"] = "AutoService.Tests.Client"
            })
            .Build();

        var service = new JwtTokenService(config);

        var tenant = new Tenant { Id = Guid.NewGuid(), Name = "Tenant", Slug = "tenant" };
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = "owner@test.local",
            FullName = "Owner Name",
            Role = UserRole.Owner
        };

        var token = service.CreateToken(user, tenant);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Issuer.Should().Be("AutoService.Tests");
        jwt.Audiences.Should().ContainSingle("AutoService.Tests.Client");
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id.ToString());
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
        jwt.Claims.Should().Contain(c => c.Type == "tenant_id" && c.Value == tenant.Id.ToString());
        jwt.Claims.Should().Contain(c => c.Type == "user_id" && c.Value == user.Id.ToString());
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == user.Role.ToString());
        jwt.ValidTo.Should().BeAfter(DateTime.UtcNow.AddDays(6));
        jwt.ValidTo.Should().BeBefore(DateTime.UtcNow.AddDays(8));
    }
}
