using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

// Customer-facing reliability & incidents payloads — split into three concerns
// (active incidents · history · business metrics), each served by its own endpoint.
// Field shapes mirror the frontend contract (client-app/src/api/incidents.ts).

public class IncidentUpdateDto
{
    public string Time { get; set; }
    public string Stage { get; set; }
    public string Text { get; set; }
    public bool Now { get; set; }
}

public class ActiveIncidentDto
{
    /// <summary>sev1 | sev2 | sev3 | maint</summary>
    public string Severity { get; set; }
    public string Title { get; set; }
    public string Started { get; set; }
    public string Ago { get; set; }
    public string Region { get; set; }
    /// <summary>Topology region ids this incident affects — drives the world-map marker colour.</summary>
    public IList<string> RegionIds { get; set; } = new List<string>();
    public string Affected { get; set; }
    public string NextUpdate { get; set; }
    /// <summary>investigating | identified | monitoring | resolved</summary>
    public string Stage { get; set; }
    public string Impact { get; set; }
    public string Doing { get; set; }
    public IList<IncidentUpdateDto> Updates { get; set; } = new List<IncidentUpdateDto>();
}

public class HistoryIncidentDto
{
    public string Date { get; set; }
    public string Severity { get; set; }
    public string Title { get; set; }
    public string Duration { get; set; }
    public string Region { get; set; }
    public string Affected { get; set; }
    public string Detected { get; set; }
    public string Cause { get; set; }
    public string Impact { get; set; }
    public bool Maintenance { get; set; }
    /// <summary>Link to the full postmortem write-up (opens in a new tab); null for maintenance.</summary>
    public string PostmortemUrl { get; set; }
}

public class IncidentKpiDto
{
    public string Key { get; set; }
    public string Value { get; set; }
    public string Unit { get; set; }
    public string Sub { get; set; }
    /// <summary>good | bad | null — colours the trend chip.</summary>
    public string Trend { get; set; }
    public string TrendText { get; set; }
}

public class IncidentsMonthDto
{
    public string Month { get; set; }
    public int Count { get; set; }
}

// ── 1. Active incidents (there may be several at once) ──────────────────────
public class ActiveIncidentsResult
{
    public string DataSource { get; set; } = "sample";
    public IList<ActiveIncidentDto> Items { get; set; } = new List<ActiveIncidentDto>();
}

// ── 2. History (paginated + filtered) ───────────────────────────────────────
public class IncidentHistorySearchCriteria
{
    public int Skip { get; set; }
    public int Take { get; set; } = 20;
    /// <summary>Filter by severity (sev1 | sev2 | sev3 | maint); empty = all severities.</summary>
    public IList<string> Severities { get; set; } = new List<string>();
    /// <summary>Free-text filter over title and cause; optional.</summary>
    public string Keyword { get; set; }
}

public class IncidentHistoryResult
{
    public string DataSource { get; set; } = "sample";
    /// <summary>Total matches before paging (for the pager / "load more").</summary>
    public int TotalCount { get; set; }
    public IList<HistoryIncidentDto> Results { get; set; } = new List<HistoryIncidentDto>();
}

// ── 3. Business metrics (KPIs + reliability trends) ─────────────────────────
public class BusinessMetricsResult
{
    public string DataSource { get; set; } = "sample";
    public IList<IncidentKpiDto> Kpis { get; set; } = new List<IncidentKpiDto>();
    public IList<IncidentsMonthDto> IncidentsPerMonth { get; set; } = new List<IncidentsMonthDto>();
    /// <summary>Mean-time-to-resolve trend (minutes), oldest → newest.</summary>
    public IList<int> MttrTrend { get; set; } = new List<int>();
}
