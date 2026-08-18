import type { CustomizationResult, MetricKey, MetricsResult, SolutionMapModel, StatusResult } from "./types";
import type { ActiveIncidentsResult, BusinessMetrics, HistoryIncident, IncidentHistoryCriteria, IncidentHistoryResult } from "./incidents";
import { mockActiveIncidents, mockBusinessMetrics, mockCustomization, mockIncidentHistory, mockMetrics, mockModel, mockStatus } from "./mock";
import { demoPreset } from "./demo";

// Dev (`vite dev`) or VITE_USE_MOCK=true → in-repo mock so the app runs standalone.
// ?demo=<preset> → client-side company preset (overrides everything, incl. live platform).
// Production → module BFF with the platform's same-origin auth cookie (spec §7).
const USE_MOCK = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === "true";
const API_BASE = import.meta.env.VITE_API_BASE || "/api/solution-architecture-map";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export function getModel(): Promise<SolutionMapModel> {
  if (demoPreset) return Promise.resolve(structuredClone(demoPreset.model));
  return USE_MOCK ? Promise.resolve(structuredClone(mockModel)) : get("/model");
}

export function getCustomization(): Promise<CustomizationResult> {
  if (demoPreset) return Promise.resolve(structuredClone(demoPreset.customization));
  return USE_MOCK ? Promise.resolve(structuredClone(mockCustomization)) : get("/customization");
}

export function getMetrics(metric: MetricKey): Promise<MetricsResult> {
  if (demoPreset) return Promise.resolve(mockMetrics(metric, demoPreset.model));
  if (USE_MOCK) return Promise.resolve(mockMetrics(metric));
  // Request a midnight-aligned UTC day window: the time engine maps minute-of-day
  // linearly onto the series, so the series must start at 00:00Z (mirrors mock.ts).
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  return get(`/metrics?metric=${metric}&from=${dayStart.toISOString()}&to=${dayEnd.toISOString()}&granularity=30`);
}

export function getStatus(): Promise<StatusResult> {
  if (demoPreset) return Promise.resolve(structuredClone(mockStatus));
  return USE_MOCK ? Promise.resolve(structuredClone(mockStatus)) : get("/status");
}

export function getActiveIncidents(): Promise<ActiveIncidentsResult> {
  if (demoPreset || USE_MOCK) return Promise.resolve({ items: structuredClone(mockActiveIncidents) });
  return get("/incidents/active");
}

export function getBusinessMetrics(): Promise<BusinessMetrics> {
  if (demoPreset || USE_MOCK) return Promise.resolve(structuredClone(mockBusinessMetrics));
  return get("/incidents/metrics");
}

export function getIncidentHistory(criteria: IncidentHistoryCriteria = {}): Promise<IncidentHistoryResult> {
  if (demoPreset || USE_MOCK) return Promise.resolve(filterHistoryMock(criteria));
  const p = new URLSearchParams();
  if (criteria.skip) p.set("skip", String(criteria.skip));
  if (criteria.take) p.set("take", String(criteria.take));
  if (criteria.severities?.length) p.set("severities", criteria.severities.join(","));
  if (criteria.keyword) p.set("keyword", criteria.keyword);
  const qs = p.toString();
  return get(`/incidents/history${qs ? "?" + qs : ""}`);
}

/** Standalone/demo history filtering + paging — mirrors SampleIncidentsProvider.GetHistoryAsync. */
function filterHistoryMock(c: IncidentHistoryCriteria): IncidentHistoryResult {
  let items: HistoryIncident[] = structuredClone(mockIncidentHistory);
  if (c.severities?.length) {
    const wanted = new Set(c.severities);
    items = items.filter((h) => wanted.has(h.severity));
  }
  if (c.keyword) {
    const kw = c.keyword.trim().toLowerCase();
    items = items.filter((h) => h.title.toLowerCase().includes(kw) || h.cause.toLowerCase().includes(kw));
  }
  const skip = c.skip ?? 0;
  const take = c.take && c.take > 0 ? c.take : 20;
  return { totalCount: items.length, results: items.slice(skip, skip + take) };
}
