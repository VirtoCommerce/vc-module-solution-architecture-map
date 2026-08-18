// ============================================================================
// Reliability & incidents — contract types + derivation helpers.
// The DATA is served by the backend IIncidentsProvider, split across three
// endpoints: GET /incidents/active · /incidents/history (paged+filtered) ·
// /incidents/metrics. The client fetches via api/client.*, falling back to the
// bundled mocks (api/mock.ts) for standalone dev / demo mode.
// ============================================================================

export type Severity = "sev1" | "sev2" | "sev3" | "maint";
export type IncidentStage = "investigating" | "identified" | "monitoring" | "resolved";

export interface IncidentUpdate {
  time: string;
  stage: string;
  text: string;
  now?: boolean;
}
export type RegionHealth = "healthy" | "degraded" | "down";

export interface ActiveIncident {
  severity: Severity;
  title: string;
  started: string;
  ago: string;
  region: string;
  /** Topology region ids this incident affects — drives the world-map marker color. */
  regionIds: string[];
  affected: string;
  nextUpdate: string;
  stage: IncidentStage;
  impact: string;
  doing: string;
  updates: IncidentUpdate[];
}
export interface HistoryIncident {
  date: string;
  severity: Severity;
  title: string;
  duration: string;
  region: string;
  affected: string;
  detected: string;
  cause: string;
  impact: string;
  maintenance?: boolean;
  /** Link to the full postmortem write-up (opens in a new tab). */
  postmortemUrl?: string;
}
export interface Kpi {
  key: string;
  value: string;
  unit?: string;
  sub: string;
  trend?: "good" | "bad";
  trendText?: string;
}

// ── endpoint payloads ───────────────────────────────────────────────────────
export interface ActiveIncidentsResult {
  items: ActiveIncident[];
}
export interface IncidentHistoryCriteria {
  skip?: number;
  take?: number;
  /** sev1 | sev2 | sev3 | maint; empty = all. */
  severities?: string[];
  keyword?: string;
}
export interface IncidentHistoryResult {
  totalCount: number;
  results: HistoryIncident[];
}
export interface BusinessMetrics {
  kpis: Kpi[];
  incidentsPerMonth: { month: string; count: number }[];
  mttrTrend: number[]; // minutes, oldest → newest
}

export const STAGES: { id: IncidentStage; label: string }[] = [
  { id: "investigating", label: "Investigating" },
  { id: "identified", label: "Identified" },
  { id: "monitoring", label: "Monitoring" },
  { id: "resolved", label: "Resolved" },
];

export const SEVERITY_LABEL: Record<Severity, string> = {
  sev1: "Sev-1", sev2: "Sev-2", sev3: "Sev-3", maint: "Maintenance",
};

/** Map an incident severity to the region-marker health it implies. */
export function severityToHealth(sev: Severity): RegionHealth | null {
  if (sev === "sev1") return "down";       // outage → red
  if (sev === "sev2" || sev === "sev3") return "degraded"; // impact → orange
  return null;                              // maintenance → no health change
}

/** Region health derived from the active incidents: affected regions turn
    orange/red automatically. 'down' wins over 'degraded' when both apply. */
export function regionHealthFromIncidents(active: ActiveIncident[]): Record<string, RegionHealth> {
  const map: Record<string, RegionHealth> = {};
  for (const inc of active) {
    const h = severityToHealth(inc.severity);
    if (!h) continue;
    for (const id of inc.regionIds) {
      if (map[id] !== "down") map[id] = h;
    }
  }
  return map;
}

export const emptyMetrics: BusinessMetrics = { kpis: [], incidentsPerMonth: [], mttrTrend: [] };
