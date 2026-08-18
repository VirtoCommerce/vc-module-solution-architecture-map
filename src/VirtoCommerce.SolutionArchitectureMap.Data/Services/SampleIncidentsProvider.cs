using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

/// <summary>
/// Sample reliability &amp; incidents data — the same content the SPA renders. Split into
/// active incidents, filtered/paginated history, and business metrics. All strings are
/// customer-safe (no internal detail).
/// </summary>
public class SampleIncidentsProvider : IIncidentsProvider
{
    public Task<ActiveIncidentsResult> GetActiveIncidentsAsync() =>
        Task.FromResult(new ActiveIncidentsResult { Items = ActiveIncidents() });

    public Task<IncidentHistoryResult> GetHistoryAsync(IncidentHistorySearchCriteria criteria)
    {
        criteria ??= new IncidentHistorySearchCriteria();
        IEnumerable<HistoryIncidentDto> query = History();

        if (criteria.Severities is { Count: > 0 })
        {
            var wanted = new HashSet<string>(criteria.Severities);
            query = query.Where(h => wanted.Contains(h.Severity));
        }
        if (!string.IsNullOrWhiteSpace(criteria.Keyword))
        {
            var kw = criteria.Keyword.Trim();
            query = query.Where(h =>
                (h.Title?.Contains(kw, System.StringComparison.OrdinalIgnoreCase) ?? false) ||
                (h.Cause?.Contains(kw, System.StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var matched = query.ToList();
        var page = matched.Skip(criteria.Skip).Take(criteria.Take <= 0 ? 20 : criteria.Take).ToList();
        return Task.FromResult(new IncidentHistoryResult { TotalCount = matched.Count, Results = page });
    }

    public Task<BusinessMetricsResult> GetBusinessMetricsAsync() =>
        Task.FromResult(new BusinessMetricsResult
        {
            Kpis =
            [
                new() { Key = "Uptime · 90 days", Value = "99.98", Unit = "%", Sub = "Target 99.99%" },
                new() { Key = "SLA compliance", Value = "100", Unit = "%", Sub = "Met every month this quarter", Trend = "good", TrendText = "" },
                new() { Key = "Avg. response · MTTA", Value = "4", Unit = "min", Sub = "vs 9 min prior quarter", Trend = "good", TrendText = "↓ 56%" },
                new() { Key = "Avg. resolve · MTTR", Value = "1h 24m", Sub = "vs 1h 48m prior quarter", Trend = "good", TrendText = "↓ 22%" },
                new() { Key = "Incidents · 90 days", Value = "3", Sub = "1 Sev-2 · 2 Sev-3", Trend = "good", TrendText = "↓ from 6" },
            ],
            IncidentsPerMonth =
            [
                new() { Month = "Feb", Count = 2 },
                new() { Month = "Mar", Count = 1 },
                new() { Month = "Apr", Count = 1 },
                new() { Month = "May", Count = 1 },
                new() { Month = "Jun", Count = 1 },
                new() { Month = "Jul", Count = 0 },
            ],
            MttrTrend = [108, 132, 96, 88, 84, 72],
        });

    private static IList<ActiveIncidentDto> ActiveIncidents() =>
    [
        new()
        {
            Severity = "sev2",
            Title = "Some US shoppers may see slower checkout",
            Started = "14:32 UTC",
            Ago = "38 min ago",
            Region = "US region",
            RegionIds = ["eastus2"],
            Affected = "~4% of active shoppers",
            NextUpdate = "by 15:30 UTC",
            Stage = "monitoring",
            Impact = "Browsing and orders are completing normally. A subset of shoppers in the US region may notice slower page loads during checkout. No customer data is affected.",
            Doing = "We identified the cause and deployed a fix. We're monitoring recovery now and will confirm full resolution in the next update.",
            Updates =
            [
                new() { Time = "15:02", Stage = "Monitoring", Now = true, Text = "Fix deployed. Error rates are falling and checkout times are returning to normal. Watching recovery before we close." },
                new() { Time = "14:48", Stage = "Identified", Text = "We pinpointed the cause in the US traffic-routing layer and began rolling out a fix." },
                new() { Time = "14:34", Stage = "Investigating", Text = "We detected elevated checkout latency in the US region and engaged the on-call team." },
            ],
        },
    ];

    private static IList<HistoryIncidentDto> History() =>
    [
        new() { Date = "Jun 10, 2026", Severity = "sev2", Title = "Brief access errors for US visitors", Duration = "1h 52m", Region = "US region", Affected = "~30% of US requests", Detected = "Automated alert", Cause = "A configuration change in the US entry layer failed under live load; we reverted it and added a stricter pre-release check.", Impact = "Some US visitors saw error pages for part of the window; no data affected.", PostmortemUrl = "https://example.com/extralarge/postmortems/39296" },
        new() { Date = "May 28, 2026", Severity = "sev2", Title = "US traffic briefly returned errors", Duration = "1h 07m", Region = "US region", Affected = "US visitors", Detected = "Automated alert", Cause = "A domain routing change misdirected US traffic; we corrected the record and validated routing end-to-end.", Impact = "Affected visitors saw an error page; browsing recovered fully after the fix.", PostmortemUrl = "https://example.com/extralarge/postmortems/39280" },
        new() { Date = "Apr 15, 2026", Severity = "sev3", Title = "Search results were delayed", Duration = "42m", Region = "Global", Affected = "~10% of searches", Detected = "Automated alert", Cause = "A search index node degraded; traffic failed over to a healthy node automatically.", Impact = "Some searches were slow or incomplete; checkout and browsing were unaffected.", PostmortemUrl = "https://example.com/extralarge/postmortems/search-2026-04-15" },
        new() { Date = "Mar 03, 2026", Severity = "sev3", Title = "Slower back-office for some staff", Duration = "1h 20m", Region = "Admin", Affected = "Internal users only", Detected = "Automated alert", Cause = "A cache node restarted; we optimized connection handling to prevent recurrence.", Impact = "Storefront and shoppers were not affected.", PostmortemUrl = "https://example.com/extralarge/postmortems/admin-2026-03-03" },
        new() { Date = "Feb 09, 2026", Severity = "sev3", Title = "Short certificate-renewal blip", Duration = "18m", Region = "EU region", Affected = "Minimal", Detected = "Automated alert", Cause = "An automated certificate renewal retried and completed successfully.", Impact = "A small number of EU requests retried; no lasting impact.", PostmortemUrl = "https://example.com/extralarge/postmortems/cert-2026-02-09" },
        new() { Date = "Jan 20, 2026", Severity = "maint", Title = "Planned platform upgrade", Duration = "30m", Region = "Global", Affected = "Scheduled window", Detected = "Planned", Maintenance = true, Cause = "Scheduled upgrade performed inside the announced maintenance window; completed on plan.", Impact = "Brief, pre-announced read-only period; no unplanned impact." },
    ];
}
