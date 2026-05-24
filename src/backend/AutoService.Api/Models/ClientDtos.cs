using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AutoService.Api.Models;

public record ClientVehicleDto(
    Guid Id,
    string Make,
    string Model,
    int? Year,
    string? LicensePlate,
    string? Vin,
    string? Notes);

public record ClientDto(
    Guid Id,
    string FullName,
    string Phone,
    string? Email,
    string? Notes,
    DateTime CreatedAt,
    IReadOnlyList<ClientVehicleDto> Vehicles);

public class ClientVehicleRequest
{
    public Guid? Id { get; set; }

    [Required, MaxLength(100)]
    public string Make { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [Range(1900, 2100)]
    public int? Year { get; set; }

    [MaxLength(20)]
    public string? LicensePlate { get; set; }

    [MaxLength(17)]
    public string? Vin { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class CreateClientRequest
{
    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string Phone { get; set; } = string.Empty;

    [EmailAddress, MaxLength(256)]
    public string? Email { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    [JsonPropertyName("vehicles")]
    public List<ClientVehicleRequest>? Vehicles { get; set; }
}

public class UpdateClientRequest
{
    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string Phone { get; set; } = string.Empty;

    [EmailAddress, MaxLength(256)]
    public string? Email { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    [JsonPropertyName("vehicles")]
    public List<ClientVehicleRequest>? Vehicles { get; set; }
}
