using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.SolutionArchitectureMap.Core;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Controllers.Api;

[ApiController]
[Route("api/solution-architecture-map")]
[Authorize(ModuleConstants.Security.Permissions.Access)]
public class SolutionArchitectureMapController(
    ISolutionTopologyProvider topologyProvider,
    ICustomizationProvider customizationProvider,
    IMetricsProvider metricsProvider,
    IServiceStatusProvider statusProvider,
    IIncidentsProvider incidentsProvider) : ControllerBase
{
    /// <summary>Max points per series a single /metrics request may produce.</summary>
    private const int MaxPointsPerSeries = 2000;

    /// <summary>Solution topology: platform, tenants, regions, connections, metric ceilings.</summary>
    [HttpGet("model")]
    [ProducesResponseType(typeof(SolutionMapModel), 200)]
    public async Task<ActionResult<SolutionMapModel>> GetModel() =>
        Ok(await topologyProvider.GetTopologyAsync());

    /// <summary>Standard-vs-custom inventory for the customization heat map.</summary>
    [HttpGet("customization")]
    [ProducesResponseType(typeof(CustomizationResult), 200)]
    public async Task<ActionResult<CustomizationResult>> GetCustomization() =>
        Ok(await customizationProvider.GetCustomizationAsync());

    /// <summary>Per-region time series. Defaults: last 24h, 30-minute granularity.</summary>
    [HttpGet("metrics")]
    [ProducesResponseType(typeof(MetricsResult), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<MetricsResult>> GetMetrics(
        [FromQuery] string metric = "requests",
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int granularity = 30)
    {
        if (!MetricsQuery.KnownMetrics.Contains(metric))
        {
            return BadRequest($"Unknown metric '{metric}'. Known: {string.Join(", ", MetricsQuery.KnownMetrics)}.");
        }
        if (granularity is < 5 or > 120)
        {
            return BadRequest("granularity must be between 5 and 120 minutes.");
        }

        var fromUtc = NormalizeToUtc(from);
        var toUtc = NormalizeToUtc(to);

        // Resolve the effective window the provider will use (same defaults), so the
        // ordering and size checks hold even when one bound is omitted.
        var effectiveTo = toUtc ?? DateTime.UtcNow;
        var effectiveFrom = fromUtc ?? effectiveTo.AddHours(-24);
        if (effectiveTo <= effectiveFrom)
        {
            return BadRequest("'to' must be after 'from'.");
        }
        // +1: the provider's loop is inclusive of both endpoints.
        var points = (effectiveTo - effectiveFrom).TotalMinutes / granularity + 1;
        if (points > MaxPointsPerSeries)
        {
            return BadRequest($"Requested window produces more than {MaxPointsPerSeries} points per series; narrow the window or increase granularity.");
        }

        var query = new MetricsQuery { Metric = metric, From = fromUtc, To = toUtc, Granularity = granularity };
        return Ok(await metricsProvider.GetMetricsAsync(query));
    }

    /// <summary>Live service statuses (poll ~15s).</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(StatusResult), 200)]
    public async Task<ActionResult<StatusResult>> GetStatus() =>
        Ok(await statusProvider.GetStatusesAsync());

    /// <summary>Currently open incidents (there may be several at once).</summary>
    [HttpGet("incidents/active")]
    [ProducesResponseType(typeof(ActiveIncidentsResult), 200)]
    public async Task<ActionResult<ActiveIncidentsResult>> GetActiveIncidents() =>
        Ok(await incidentsProvider.GetActiveIncidentsAsync());

    /// <summary>Resolved-incident history — filtered by severity/keyword, paginated.</summary>
    [HttpGet("incidents/history")]
    [ProducesResponseType(typeof(IncidentHistoryResult), 200)]
    public async Task<ActionResult<IncidentHistoryResult>> GetIncidentHistory(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20,
        [FromQuery] string severities = null,
        [FromQuery] string keyword = null)
    {
        var criteria = new IncidentHistorySearchCriteria
        {
            Skip = skip < 0 ? 0 : skip,
            Take = take is <= 0 or > 200 ? 20 : take,
            Severities = string.IsNullOrWhiteSpace(severities)
                ? []
                : severities.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            Keyword = keyword,
        };
        return Ok(await incidentsProvider.GetHistoryAsync(criteria));
    }

    /// <summary>Business metrics: KPIs (uptime, SLA, MTTA, MTTR) and reliability trends.</summary>
    [HttpGet("incidents/metrics")]
    [ProducesResponseType(typeof(BusinessMetricsResult), 200)]
    public async Task<ActionResult<BusinessMetricsResult>> GetBusinessMetrics() =>
        Ok(await incidentsProvider.GetBusinessMetricsAsync());

    /// <summary>Query binding may yield Unspecified kind; treat it as UTC so serialized ts values carry Z.</summary>
    private static DateTime? NormalizeToUtc(DateTime? value) =>
        value.HasValue
            ? value.Value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
                : value.Value.ToUniversalTime()
            : null;
}
