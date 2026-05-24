using AutoService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AutoService.Infrastructure.Persistence;

public static class DevelopmentDataSeeder
{
    public const string DemoSlug = "demo-garage";
    public const string DemoEmail = "owner@demo.local";
    public const string DemoPassword = "demo123";

    public static async Task SeedAsync(AppDbContext db, string passwordHash, CancellationToken ct = default)
    {
        if (await db.Tenants.AnyAsync(t => t.Slug == DemoSlug, ct))
            return;

        var now = DateTime.UtcNow;
        var tenantId = Guid.NewGuid();

        var tenant = new Tenant
        {
            Id = tenantId,
            Name = "Демо Автосервис",
            Slug = DemoSlug,
            TimeZone = "Europe/Moscow",
            CreatedAt = now.AddMonths(-3)
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = DemoEmail,
            PasswordHash = passwordHash,
            FullName = "Алексей Демонов",
            Role = UserRole.Owner,
            CreatedAt = now.AddMonths(-3)
        };

        db.Tenants.Add(tenant);
        db.Users.Add(user);

        var clients = CreateClients(tenantId, now);
        db.Clients.AddRange(clients);

        var workOrders = CreateWorkOrders(tenantId, clients, now);
        db.WorkOrders.AddRange(workOrders);

        var appointments = CreateAppointments(tenantId, clients, workOrders, now);
        db.Appointments.AddRange(appointments);

        await db.SaveChangesAsync(ct);
    }

    private static List<Client> CreateClients(Guid tenantId, DateTime now)
    {
        var ivanov = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FullName = "Иванов Пётр Сергеевич",
            Phone = "+79001234567",
            Email = "ivanov@example.com",
            Notes = "Постоянный клиент, предпочитает утренние слоты",
            CreatedAt = now.AddMonths(-2)
        };
        ivanov.Vehicles.Add(new ClientVehicle
        {
            Id = Guid.NewGuid(),
            ClientId = ivanov.Id,
            Make = "Toyota",
            Model = "Camry",
            Year = 2018,
            LicensePlate = "А123ВС77",
            Vin = "JTDBR32E720123456"
        });
        ivanov.Vehicles.Add(new ClientVehicle
        {
            Id = Guid.NewGuid(),
            ClientId = ivanov.Id,
            Make = "Lada",
            Model = "Vesta",
            Year = 2021,
            LicensePlate = "К456МН77"
        });

        var sidorova = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FullName = "Сидорова Анна Викторовна",
            Phone = "+79007654321",
            Email = "sidorova@mail.ru",
            CreatedAt = now.AddMonths(-1)
        };
        sidorova.Vehicles.Add(new ClientVehicle
        {
            Id = Guid.NewGuid(),
            ClientId = sidorova.Id,
            Make = "Hyundai",
            Model = "Solaris",
            Year = 2019,
            LicensePlate = "В789ОР99",
            Vin = "Z94CB41AADR123456"
        });

        var kozlov = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FullName = "Козлов Дмитрий Игоревич",
            Phone = "+79165551234",
            Notes = "Корпоративный договор",
            CreatedAt = now.AddDays(-20)
        };
        kozlov.Vehicles.Add(new ClientVehicle
        {
            Id = Guid.NewGuid(),
            ClientId = kozlov.Id,
            Make = "BMW",
            Model = "X5",
            Year = 2020,
            LicensePlate = "Е111КХ77",
            Vin = "WBAFR9C50DD123456"
        });
        kozlov.Vehicles.Add(new ClientVehicle
        {
            Id = Guid.NewGuid(),
            ClientId = kozlov.Id,
            Make = "Volkswagen",
            Model = "Polo",
            Year = 2016,
            LicensePlate = "М222АА50"
        });

        var petrov = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FullName = "Петров Николай",
            Phone = "+79261239876",
            CreatedAt = now.AddDays(-5)
        };
        petrov.Vehicles.Add(new ClientVehicle
        {
            Id = Guid.NewGuid(),
            ClientId = petrov.Id,
            Make = "Kia",
            Model = "Rio",
            Year = 2022,
            LicensePlate = "Н333СС77"
        });

        return [ivanov, sidorova, kozlov, petrov];
    }

    private static List<WorkOrder> CreateWorkOrders(Guid tenantId, List<Client> clients, DateTime now)
    {
        var ivanov = clients[0];
        var ivanovCamry = ivanov.Vehicles.First();
        var sidorova = clients[1];
        var sidorovaCar = sidorova.Vehicles.First();
        var kozlov = clients[2];
        var kozlovBmw = kozlov.Vehicles.First();

        var wo1 = new WorkOrder
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Number = 1,
            ClientId = ivanov.Id,
            ClientVehicleId = ivanovCamry.Id,
            Status = WorkOrderStatus.Done,
            OpenedAt = now.AddDays(-10).Date.AddHours(9),
            ClosedAt = now.AddDays(-8).Date.AddHours(18),
            Description = "ТО-60 000 км: масло, фильтры, диагностика",
            CreatedAt = now.AddDays(-10)
        };
        wo1.Lines.Add(Line(wo1.Id, WorkOrderLineType.Labor, "Замена масла и фильтров", 1.5m, 2500m));
        wo1.Lines.Add(Line(wo1.Id, WorkOrderLineType.Part, "Масло моторное 5W-30, 4 л", 1m, 3200m));
        wo1.Lines.Add(Line(wo1.Id, WorkOrderLineType.Part, "Фильтр масляный", 1m, 650m));
        wo1.Lines.Add(Line(wo1.Id, WorkOrderLineType.Part, "Фильтр воздушный", 1m, 890m));

        var wo2 = new WorkOrder
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Number = 2,
            ClientId = sidorova.Id,
            ClientVehicleId = sidorovaCar.Id,
            Status = WorkOrderStatus.InProgress,
            OpenedAt = now.AddDays(-2).Date.AddHours(10).AddMinutes(30),
            Description = "Замена передних тормозных колодок",
            CreatedAt = now.AddDays(-2)
        };
        wo2.Lines.Add(Line(wo2.Id, WorkOrderLineType.Labor, "Замена передних колодок", 2m, 2800m));
        wo2.Lines.Add(Line(wo2.Id, WorkOrderLineType.Part, "Колодки передние (комплект)", 1m, 4500m));

        var wo3 = new WorkOrder
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Number = 3,
            ClientId = kozlov.Id,
            ClientVehicleId = kozlovBmw.Id,
            Status = WorkOrderStatus.Draft,
            OpenedAt = now.AddDays(1).Date.AddHours(11),
            Description = "Диагностика подвески, стук спереди",
            CreatedAt = now.AddDays(-1)
        };

        var wo4 = new WorkOrder
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Number = 4,
            ClientId = ivanov.Id,
            ClientVehicleId = ivanov.Vehicles.Skip(1).First().Id,
            Status = WorkOrderStatus.Draft,
            OpenedAt = now.AddDays(3).Date.AddHours(14),
            Description = "Шиномонтаж, балансировка",
            CreatedAt = now
        };
        wo4.Lines.Add(Line(wo4.Id, WorkOrderLineType.Labor, "Шиномонтаж 4 колеса", 1m, 2000m));
        wo4.Lines.Add(Line(wo4.Id, WorkOrderLineType.Labor, "Балансировка 4 колеса", 1m, 1600m));

        return [wo1, wo2, wo3, wo4];
    }

    private static WorkOrderLine Line(Guid workOrderId, WorkOrderLineType type, string name, decimal qty, decimal price) =>
        new()
        {
            Id = Guid.NewGuid(),
            WorkOrderId = workOrderId,
            Type = type,
            Name = name,
            Quantity = qty,
            UnitPrice = price
        };

    private static List<Appointment> CreateAppointments(
        Guid tenantId,
        List<Client> clients,
        List<WorkOrder> workOrders,
        DateTime now)
    {
        var ivanov = clients[0];
        var ivanovCamry = ivanov.Vehicles.First();
        var sidorova = clients[1];
        var sidorovaCar = sidorova.Vehicles.First();
        var kozlov = clients[2];
        var kozlovBmw = kozlov.Vehicles.First();
        var petrov = clients[3];
        var petrovCar = petrov.Vehicles.First();

        var wo2 = workOrders[1];
        var wo3 = workOrders[2];
        var wo4 = workOrders[3];

        static DateTime Slot(DateTime baseDate, int dayOffset, int hour, int minute = 0) =>
            baseDate.Date.AddDays(dayOffset).AddHours(hour).AddMinutes(minute);

        return
        [
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = sidorova.Id,
                ClientVehicleId = sidorovaCar.Id,
                WorkOrderId = wo2.Id,
                Status = AppointmentStatus.Confirmed,
                StartsAt = Slot(now, -2, 10),
                EndsAt = Slot(now, -2, 12),
                Notes = "Клиент ждёт в зале ожидания",
                CreatedAt = now.AddDays(-5)
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = kozlov.Id,
                ClientVehicleId = kozlovBmw.Id,
                WorkOrderId = wo3.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Slot(now, 1, 11),
                EndsAt = Slot(now, 1, 13),
                Notes = "Диагностика подвески",
                CreatedAt = now.AddDays(-1)
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = ivanov.Id,
                ClientVehicleId = ivanov.Vehicles.Skip(1).First().Id,
                WorkOrderId = wo4.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Slot(now, 3, 14),
                EndsAt = Slot(now, 3, 16),
                CreatedAt = now
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = ivanov.Id,
                ClientVehicleId = ivanovCamry.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Slot(now, 0, 10),
                EndsAt = Slot(now, 0, 11, 30),
                Notes = "Консультация по ТО",
                CreatedAt = now.AddDays(-3)
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = petrov.Id,
                ClientVehicleId = petrovCar.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Slot(now, 0, 15),
                EndsAt = Slot(now, 0, 16, 30),
                CreatedAt = now.AddDays(-2)
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = sidorova.Id,
                ClientVehicleId = sidorovaCar.Id,
                Status = AppointmentStatus.Completed,
                StartsAt = Slot(now, -7, 9),
                EndsAt = Slot(now, -7, 10, 30),
                Notes = "Замена масла — выполнено",
                CreatedAt = now.AddDays(-14)
            }
        ];
    }
}
