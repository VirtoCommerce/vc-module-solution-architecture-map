using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>
/// Serves the customer-facing reliability &amp; incidents view, split into three concerns.
/// Sample implementation ships in the box; swap the DI binding for a live incident system
/// (e.g. Statuspage / incident.io / internal) without UI changes.
/// </summary>
public interface IIncidentsProvider
{
    /// <summary>Currently open incidents (there may be several at once).</summary>
    Task<ActiveIncidentsResult> GetActiveIncidentsAsync();

    /// <summary>Resolved-incident history, filtered and paginated.</summary>
    Task<IncidentHistoryResult> GetHistoryAsync(IncidentHistorySearchCriteria criteria);

    /// <summary>Business metrics: KPIs (uptime, SLA, MTTA, MTTR) and reliability trends.</summary>
    Task<BusinessMetricsResult> GetBusinessMetricsAsync();
}
