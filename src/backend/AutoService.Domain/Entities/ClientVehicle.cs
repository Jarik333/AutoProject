namespace AutoService.Domain.Entities;

public class ClientVehicle
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int? Year { get; set; }
    public string? LicensePlate { get; set; }
    public string? Vin { get; set; }
    public string? Notes { get; set; }

    public Client Client { get; set; } = null!;
    public ICollection<WorkOrder> WorkOrders { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
}
