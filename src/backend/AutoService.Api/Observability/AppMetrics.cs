using Prometheus;

namespace AutoService.Api.Observability;

public static class AppMetrics
{
    public static readonly Counter LoginAttempts = Prometheus.Metrics.CreateCounter(
        "autoservice_login_attempts_total",
        "Login attempts by result.",
        new CounterConfiguration { LabelNames = ["result"] });

    public static readonly Counter TenantRegistrations = Prometheus.Metrics.CreateCounter(
        "autoservice_tenant_registrations_total",
        "Tenant registrations by result.",
        new CounterConfiguration { LabelNames = ["result"] });

    public static readonly Counter ClientsCreated = Prometheus.Metrics.CreateCounter(
        "autoservice_clients_created_total",
        "Clients created.");

    public static readonly Counter AppointmentsCreated = Prometheus.Metrics.CreateCounter(
        "autoservice_appointments_created_total",
        "Appointments created.");

    public static readonly Counter WorkOrdersCreated = Prometheus.Metrics.CreateCounter(
        "autoservice_work_orders_created_total",
        "Work orders created.",
        new CounterConfiguration { LabelNames = ["source"] });
}
