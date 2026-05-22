using System.ComponentModel.DataAnnotations;

namespace AutoService.Api.Models;

public record ClientDto(Guid Id, string FullName, string Phone, string? Email, string? Notes, DateTime CreatedAt);

public record CreateClientRequest(
    [Required, MaxLength(200)] string FullName,
    [Required, MaxLength(32)] string Phone,
    [EmailAddress, MaxLength(256)] string? Email,
    [MaxLength(2000)] string? Notes);

public record UpdateClientRequest(
    [Required, MaxLength(200)] string FullName,
    [Required, MaxLength(32)] string Phone,
    [EmailAddress, MaxLength(256)] string? Email,
    [MaxLength(2000)] string? Notes);
