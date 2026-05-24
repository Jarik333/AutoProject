namespace AutoService.Domain.Entities;

public class WorkOrderLine
{
    public Guid Id { get; set; }
    public Guid WorkOrderId { get; set; }
    public WorkOrderLineType Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public WorkOrder WorkOrder { get; set; } = null!;
}
