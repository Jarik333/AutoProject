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

    public static async Task RefreshDemoAppointmentsAsync(AppDbContext db, CancellationToken ct = default)
    {
        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Slug == DemoSlug, ct);
        if (tenant is null)
            return;

        var existing = await db.Appointments.Where(a => a.TenantId == tenant.Id).ToListAsync(ct);
        if (existing.Count > 0)
            db.Appointments.RemoveRange(existing);

        var clients = await db.Clients
            .Include(c => c.Vehicles)
            .Where(c => c.TenantId == tenant.Id)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);

        if (clients.Count < 4)
            return;

        var workOrders = await db.WorkOrders
            .Where(w => w.TenantId == tenant.Id)
            .OrderBy(w => w.Number)
            .ToListAsync(ct);

        var appointments = CreateAppointments(tenant.Id, clients, workOrders, DateTime.UtcNow);
        db.Appointments.AddRange(appointments);

        foreach (var appt in appointments.Where(a => a.WorkOrderId.HasValue))
        {
            var order = workOrders.FirstOrDefault(w => w.Id == appt.WorkOrderId);
            if (order is not null)
                order.OpenedAt = appt.StartsAt;
        }

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

        var moscow = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "Russian Standard Time" : "Europe/Moscow");

        static DateTime Slot(
            TimeZoneInfo tz,
            DateTime utcNow,
            int dayOffset,
            int hour,
            int minute = 0)
        {
            var localToday = TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz).Date;
            var localStart = localToday.AddDays(dayOffset).AddHours(hour).AddMinutes(minute);
            return TimeZoneInfo.ConvertTimeToUtc(localStart, tz);
        }

        DateTime Range(int day, int startHour, int startMin, int endHour, int endMin) =>
            Slot(moscow, now, day, startHour, startMin);

        var end = (int day, int h, int m) => Slot(moscow, now, day, h, m);

        return
        [
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = ivanov.Id,
                ClientVehicleId = ivanovCamry.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Range(0, 9, 0, 10, 30),
                EndsAt = end(0, 10, 30),
                Notes = "Консультация по ТО",
                CreatedAt = now.AddDays(-1)
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = petrov.Id,
                ClientVehicleId = petrovCar.Id,
                Status = AppointmentStatus.Confirmed,
                StartsAt = Range(0, 11, 0, 12, 30),
                EndsAt = end(0, 12, 30),
                Notes = "Замена свечей зажигания",
                CreatedAt = now.AddDays(-1)
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = kozlov.Id,
                ClientVehicleId = kozlovBmw.Id,
                WorkOrderId = wo3.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Range(0, 14, 0, 16, 0),
                EndsAt = end(0, 16, 0),
                Notes = "Диагностика подвески, стук спереди",
                CreatedAt = now
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = sidorova.Id,
                ClientVehicleId = sidorovaCar.Id,
                WorkOrderId = wo2.Id,
                Status = AppointmentStatus.Confirmed,
                StartsAt = Range(1, 10, 0, 12, 0),
                EndsAt = end(1, 12, 0),
                Notes = "Замена передних тормозных колодок",
                CreatedAt = now
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = ivanov.Id,
                ClientVehicleId = ivanov.Vehicles.Skip(1).First().Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Range(1, 15, 0, 16, 30),
                EndsAt = end(1, 16, 30),
                Notes = "Проверка ходовой части",
                CreatedAt = now
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = kozlov.Id,
                ClientVehicleId = kozlov.Vehicles.Skip(1).First().Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Range(2, 9, 30, 11, 0),
                EndsAt = end(2, 11, 0),
                CreatedAt = now
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = ivanov.Id,
                ClientVehicleId = ivanov.Vehicles.Skip(1).First().Id,
                WorkOrderId = wo4.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Range(3, 14, 0, 16, 0),
                EndsAt = end(3, 16, 0),
                Notes = "Шиномонтаж, балансировка",
                CreatedAt = now
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = sidorova.Id,
                ClientVehicleId = sidorovaCar.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Range(4, 10, 0, 11, 30),
                EndsAt = end(4, 11, 30),
                Notes = "Компьютерная диагностика",
                CreatedAt = now
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = petrov.Id,
                ClientVehicleId = petrovCar.Id,
                Status = AppointmentStatus.Confirmed,
                StartsAt = Range(5, 11, 0, 12, 30),
                EndsAt = end(5, 12, 30),
                CreatedAt = now
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = ivanov.Id,
                ClientVehicleId = ivanovCamry.Id,
                Status = AppointmentStatus.Scheduled,
                StartsAt = Range(6, 16, 0, 17, 30),
                EndsAt = end(6, 17, 30),
                Notes = "Запись на следующую неделю",
                CreatedAt = now
            }
        ];
    }
}
