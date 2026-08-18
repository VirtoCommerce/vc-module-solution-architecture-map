import type { ComponentDto, CustomizationResult, MetricKey, MetricsResult, SolutionMapModel, StatusResult } from "./types";
import type { ActiveIncident, BusinessMetrics, HistoryIncident } from "./incidents";

// Mock data mirroring the C# Sample* providers byte-for-byte, so `vite dev` (standalone)
// renders exactly what a live platform with sample providers renders.

export const mockModel: SolutionMapModel = {
  dataSource: "sample",
  platform: { name: "Virto Commerce", version: "3.1039.0" },
  project: {
    customer: { title: "Extra Large", logoUrl: "" },
    partner: { name: "Implementation Partner", website: "", logoUrl: "" },
  },
  tenants: [
    { id: "china", name: "Extra Large Tenant", cloud: "Azure China (21Vianet)", description: "Isolated tenant for China data residency; local write, reads from East Asia." },
    { id: "global", name: "Virto Tenant", cloud: "Microsoft Azure", description: "Commercial Azure; East US 2 master write with geo-replicated reads." },
  ],
  regions: [
    { id: "eastus2", name: "East US 2", city: "Virginia · Master Write", lat: 37.0, lon: -79.0, tenantId: "global", role: "master-write", master: true, tzOffset: -4, weight: 1.0 },
    { id: "germany", name: "Germany West Central", city: "Frankfurt · Read replica", lat: 50.1, lon: 8.7, tenantId: "global", role: "read-replica", tzOffset: 2, weight: 0.66 },
    { id: "japan", name: "Japan East", city: "Tokyo · Read replica", lat: 35.7, lon: 139.7, tenantId: "global", role: "read-replica", tzOffset: 9, weight: 0.58 },
    { id: "eastasia", name: "East Asia", city: "Hong Kong · Read/cache", lat: 22.3, lon: 114.2, tenantId: "global", role: "read-cache", tzOffset: 8, weight: 0.42 },
    { id: "china", name: "China North 3", city: "21Vianet · Local R/W", lat: 39.9, lon: 116.4, tenantId: "china", role: "local-rw", tzOffset: 8, weight: 0.74 },
  ],
  connections: [
    { from: "eastus2", to: "germany", type: "replication" },
    { from: "eastus2", to: "japan", type: "replication" },
    { from: "eastus2", to: "eastasia", type: "replication" },
    { from: "germany", to: "eastus2", type: "mutation" },
    { from: "japan", to: "eastus2", type: "mutation" },
    { from: "eastasia", to: "eastus2", type: "mutation" },
    { from: "eastus2", to: "china", type: "syncer" },
    { from: "eastasia", to: "china", type: "replication" },
  ],
  // Virto Cloud datacenter catalog (hosting options) — mirrors SampleData.cs.
  // A DC co-located with a solution region is merged into the region marker by the UI.
  datacenters: [
    { id: "westeurope", name: "West Europe", lat: 52.37, lon: 4.90, current: false },
    { id: "eastus", name: "East US", lat: 37.37, lon: -79.82, current: true },
    { id: "westus", name: "West US", lat: 37.78, lon: -122.42, current: false },
    { id: "australiaeast", name: "Australia East", lat: -33.87, lon: 151.21, current: false },
    { id: "japaneast", name: "Japan East", lat: 35.7, lon: 139.7, current: true },
    { id: "chinanorth3", name: "China North 3", lat: 39.9, lon: 116.4, current: true },
  ],
  metricMax: { requests: 2400, users: 12000, orders: 280, instances: 18 },
  // Live-only field (search-index product count). Set here so the standalone/demo
  // build shows the real "SKUs in catalog" tile; live serves it from the platform.
  catalogSize: 65432,
};

const mockComponents: ComponentDto[] = [
  // Virto Cloud (infrastructure)
  { id: "h_aks", name: "Azure Kubernetes Service", group: "cloud", level: 0, azureService: "AKS", version: "1.32.9", owner: "Virto" },
  { id: "h_afd", name: "Front Door + WAF", group: "cloud", level: 0, azureService: "AFD Premium + WAF", owner: "Virto" },
  { id: "h_sql", name: "Azure SQL (geo-replicas)", group: "cloud", level: 0, azureService: "Azure SQL", version: "12.0", owner: "Virto" },
  { id: "h_redis", name: "Azure Managed Redis", group: "cloud", level: 0, azureService: "Redis", version: "7.4", owner: "Virto" },
  { id: "h_es", name: "Elasticsearch", group: "cloud", level: 0, version: "8.19.7", owner: "Virto" },
  { id: "h_kv", name: "Key Vault", group: "cloud", level: 0, azureService: "Azure Key Vault", owner: "Virto" },
  { id: "h_mon", name: "Monitoring / App Insights", group: "cloud", level: 0, azureService: "Azure Monitor", owner: "Virto" },
  { id: "h_argo", name: "Argo CD · vc-build CI/CD", group: "cloud", level: 0, owner: "Virto" },
  { id: "h_tenant", name: "21Vianet tenant setup", group: "cloud", level: 1, owner: "Virto + client" },
  { id: "h_afdr", name: "Per-region AFD routing", group: "cloud", level: 2, note: "Thin networking layer hardened with new QA gates." },
  { id: "h_ingress", name: "NGINX ingress topology", group: "cloud", level: 2, note: "Region-specific ingress customization." },
  { id: "h_syncer", name: "Cross-region DB Syncer", group: "cloud", level: 3, owner: "Virto (custom component)", note: "Bi-directional China⇄US sync." },
  // Virto Commerce (platform & modules)
  { id: "h_cat", name: "Catalog", group: "commerce", level: 0 }, { id: "h_cart", name: "Cart", group: "commerce", level: 0 },
  { id: "h_ord", name: "Orders", group: "commerce", level: 0 }, { id: "h_cust", name: "Customer", group: "commerce", level: 0 },
  { id: "h_mkt", name: "Marketing", group: "commerce", level: 0 }, { id: "h_inv", name: "Inventory", group: "commerce", level: 0 },
  { id: "h_cms", name: "Content / CMS", group: "commerce", level: 0 }, { id: "h_sidx", name: "Search Index", group: "commerce", level: 0 },
  { id: "h_ei", name: "Export / Import", group: "commerce", level: 0 },
  { id: "h_price", name: "Pricing", group: "commerce", level: 1, note: "Standard module driven by price-list config." },
  { id: "h_ship", name: "Shipping", group: "commerce", level: 1 }, { id: "h_pay", name: "Payment", group: "commerce", level: 1 },
  { id: "h_xapi", name: "GraphQL XAPI", group: "commerce", level: 1 },
  { id: "h_fe", name: "Vue 3 Frontend theme", group: "commerce", level: 1, note: "Storefront-less SPA with theming & brand config." },
  { id: "h_rules", name: "Regional Catalog Rules", group: "commerce", level: 3, owner: "Implementation Partner" },
  { id: "h_erp", name: "ERP Integration", group: "commerce", level: 3, owner: "Implementation Partner" },
  { id: "h_chk", name: "Custom Checkout", group: "commerce", level: 3, owner: "Implementation Partner" },
  { id: "h_rprice", name: "Region Pricing Logic", group: "commerce", level: 3, owner: "Implementation Partner" },
];

export const mockCustomization: CustomizationResult = { dataSource: "sample", items: mockComponents };

export const mockStatus: StatusResult = {
  dataSource: "sample",
  statuses: [
    { componentId: "h_syncer", state: "healthy", latencyMs: 34 },
    { componentId: "h_sql", state: "healthy", latencyMs: 12 },
  ],
};

// Reliability & incidents fallback — the same content the backend SampleIncidentsProvider
// serves, split across the three endpoints; used for standalone dev / demo mode.
export const mockActiveIncidents: ActiveIncident[] = [
  {
    severity: "sev2",
    title: "Some US shoppers may see slower checkout",
    started: "14:32 UTC",
    ago: "38 min ago",
    region: "US region",
    regionIds: ["eastus2"],
    affected: "~4% of active shoppers",
    nextUpdate: "by 15:30 UTC",
    stage: "monitoring",
    impact: "Browsing and orders are completing normally. A subset of shoppers in the US region may notice slower page loads during checkout. No customer data is affected.",
    doing: "We identified the cause and deployed a fix. We're monitoring recovery now and will confirm full resolution in the next update.",
    updates: [
      { time: "15:02", stage: "Monitoring", now: true, text: "Fix deployed. Error rates are falling and checkout times are returning to normal. Watching recovery before we close." },
      { time: "14:48", stage: "Identified", text: "We pinpointed the cause in the US traffic-routing layer and began rolling out a fix." },
      { time: "14:34", stage: "Investigating", text: "We detected elevated checkout latency in the US region and engaged the on-call team." },
    ],
  },
];

export const mockBusinessMetrics: BusinessMetrics = {
  kpis: [
    { key: "Uptime · 90 days", value: "99.98", unit: "%", sub: "Target 99.99%" },
    { key: "SLA compliance", value: "100", unit: "%", sub: "Met every month this quarter", trend: "good", trendText: "" },
    { key: "Avg. response · MTTA", value: "4", unit: "min", sub: "vs 9 min prior quarter", trend: "good", trendText: "↓ 56%" },
    { key: "Avg. resolve · MTTR", value: "1h 24m", sub: "vs 1h 48m prior quarter", trend: "good", trendText: "↓ 22%" },
    { key: "Incidents · 90 days", value: "3", sub: "1 Sev-2 · 2 Sev-3", trend: "good", trendText: "↓ from 6" },
  ],
  incidentsPerMonth: [
    { month: "Feb", count: 2 }, { month: "Mar", count: 1 }, { month: "Apr", count: 1 },
    { month: "May", count: 1 }, { month: "Jun", count: 1 }, { month: "Jul", count: 0 },
  ],
  mttrTrend: [108, 132, 96, 88, 84, 72],
};

export const mockIncidentHistory: HistoryIncident[] = [
  { date: "Jun 10, 2026", severity: "sev2", title: "Brief access errors for US visitors", duration: "1h 52m", region: "US region", affected: "~30% of US requests", detected: "Automated alert", cause: "A configuration change in the US entry layer failed under live load; we reverted it and added a stricter pre-release check.", impact: "Some US visitors saw error pages for part of the window; no data affected.", postmortemUrl: "https://example.com/extralarge/postmortems/39296" },
  { date: "May 28, 2026", severity: "sev2", title: "US traffic briefly returned errors", duration: "1h 07m", region: "US region", affected: "US visitors", detected: "Automated alert", cause: "A domain routing change misdirected US traffic; we corrected the record and validated routing end-to-end.", impact: "Affected visitors saw an error page; browsing recovered fully after the fix.", postmortemUrl: "https://example.com/extralarge/postmortems/39280" },
  { date: "Apr 15, 2026", severity: "sev3", title: "Search results were delayed", duration: "42m", region: "Global", affected: "~10% of searches", detected: "Automated alert", cause: "A search index node degraded; traffic failed over to a healthy node automatically.", impact: "Some searches were slow or incomplete; checkout and browsing were unaffected.", postmortemUrl: "https://example.com/extralarge/postmortems/search-2026-04-15" },
  { date: "Mar 03, 2026", severity: "sev3", title: "Slower back-office for some staff", duration: "1h 20m", region: "Admin", affected: "Internal users only", detected: "Automated alert", cause: "A cache node restarted; we optimized connection handling to prevent recurrence.", impact: "Storefront and shoppers were not affected.", postmortemUrl: "https://example.com/extralarge/postmortems/admin-2026-03-03" },
  { date: "Feb 09, 2026", severity: "sev3", title: "Short certificate-renewal blip", duration: "18m", region: "EU region", affected: "Minimal", detected: "Automated alert", cause: "An automated certificate renewal retried and completed successfully.", impact: "A small number of EU requests retried; no lasting impact.", postmortemUrl: "https://example.com/extralarge/postmortems/cert-2026-02-09" },
  { date: "Jan 20, 2026", severity: "maint", title: "Planned platform upgrade", duration: "30m", region: "Global", affected: "Scheduled window", detected: "Planned", maintenance: true, cause: "Scheduled upgrade performed inside the announced maintenance window; completed on plan.", impact: "Brief, pre-announced read-only period; no unplanned impact." },
];

/** Same diurnal generator as the server's SampleMetricsProvider (server is source of truth).
    Accepts an alternate model so demo presets get series for their own regions. */
export function mockMetrics(metric: MetricKey, model: SolutionMapModel = mockModel): MetricsResult {
  const g = (h: number, mu: number, s: number) => {
    let d = Math.abs(h - mu);
    d = Math.min(d, 24 - d);
    return Math.exp(-(d * d) / (2 * s * s));
  };
  const diurnal = (h: number) => Math.max(0.04, Math.min(1, 1.16 * (0.14 + 0.86 * (0.74 * g(h, 13, 3.4) + 0.46 * g(h, 20, 2.1)))));
  const max = model.metricMax[metric];
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  return {
    dataSource: "sample",
    metric,
    series: model.regions.map((r) => ({
      regionId: r.id,
      points: Array.from({ length: 49 }, (_, i) => {
        const ts = new Date(dayStart.getTime() + i * 30 * 60_000);
        const hUtc = ts.getUTCHours() + ts.getUTCMinutes() / 60;
        const localH = ((hUtc + r.tzOffset) % 24 + 24) % 24;
        const f = diurnal(localH);
        const value = metric === "instances" ? Math.max(3, Math.round(3 + (max - 3) * f * r.weight)) : Math.round(max * r.weight * f);
        return { ts: ts.toISOString(), value };
      }),
    })),
  };
}
