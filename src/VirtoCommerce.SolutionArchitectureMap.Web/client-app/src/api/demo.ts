import type { ComponentDto, CustomizationResult, SolutionMapModel } from "./types";
import { mockCustomization, mockModel } from "./mock";

// ============================================================================
// DEMO MODE — anonymized customer-size presets for UI testing.
// Presets are named by deployment size: small | medium | large | extralarge.
// Activate with ?demo=extralarge | large | medium | small (works in `npm run dev`
// AND against a live platform: /apps/solution-architecture-map/?demo=large).
// Launch helper: client-app/demo.ps1 or `npm run demo:<name>`.
// ============================================================================

export interface DemoPreset {
  model: SolutionMapModel;
  customization: CustomizationResult;
  /** CSS custom properties applied on :root (brand theming). */
  theme?: Record<string, string>;
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

/** Replace the default partner attribution on custom heat-map items. */
function rebrandCustomization(partnerName: string): CustomizationResult {
  const c = clone(mockCustomization);
  for (const item of c.items) {
    if (item.owner === "Implementation Partner") item.owner = partnerName;
  }
  return c;
}

/** MEDIUM — two regions (East US master + West US replica) kept in sync; blue theme. */
function medium(): DemoPreset {
  const model = clone(mockModel);
  model.project = {
    customer: { title: "Medium", logoUrl: "" },
    partner: { name: "Virto Commerce Professional Services", website: "https://virtocommerce.com/", logoUrl: "" },
  };
  model.tenants = [
    { id: "global", name: "Medium Tenant", cloud: "Microsoft Azure", description: "Commercial Azure; East US master write with a West US replica kept in sync." },
  ];
  model.regions = [
    { id: "eastus", name: "East US", city: "Virginia · Master Write", lat: 37.37, lon: -79.82, tenantId: "global", role: "master-write", master: true, tzOffset: -4, weight: 1.0 },
    { id: "westus", name: "West US", city: "California · Read replica", lat: 37.78, lon: -122.42, tenantId: "global", role: "read-replica", tzOffset: -7, weight: 0.8 },
  ];
  model.connections = [
    { from: "eastus", to: "westus", type: "replication" },
    { from: "westus", to: "eastus", type: "mutation" },
  ];
  model.datacenters = model.datacenters.map((d) => ({ ...d, current: d.id === "eastus" || d.id === "westus" }));
  return {
    model,
    customization: rebrandCustomization("Virto Commerce Professional Services"),
    theme: {
      "--tl-red": "#2B7FFF",
      "--tl-red-deep": "#1A56CC",
      "--tl-red-bright": "#4D9AFF",
      "--tl-red-soft": "rgba(43,127,255,0.14)",
    },
  };
}

/** SMALL — single region in West Europe, no replications. */
function small(): DemoPreset {
  const model = clone(mockModel);
  model.project = {
    customer: { title: "Small", logoUrl: "" },
    partner: { name: "Implementation Partner", website: "", logoUrl: "" },
  };
  model.tenants = [
    { id: "global", name: "Small Tenant", cloud: "Microsoft Azure", description: "Commercial Azure; single-region deployment in West Europe." },
  ];
  model.regions = [
    { id: "westeurope", name: "West Europe", city: "Amsterdam · Read/Write", lat: 52.37, lon: 4.90, tenantId: "global", role: "master-write", master: true, tzOffset: 2, weight: 1.0 },
  ];
  model.connections = [];
  model.datacenters = model.datacenters.map((d) => ({ ...d, current: d.id === "westeurope" }));
  return { model, customization: rebrandCustomization("Implementation Partner") };
}

/** EXTRA LARGE — the full multi-region + China reference architecture (default mock). */
function extralarge(): DemoPreset {
  return { model: clone(mockModel), customization: clone(mockCustomization) };
}

// ── LARGE — multi-market B2B ─────────────────────────────────────────────────
// 25 B2B markets, each an INDEPENDENT single-region instance on the nearest Azure
// region — one shared codebase, no cross-market replication or data sharing.
// Modeled on a real large-enterprise deployment: ~24 custom extension modules on
// top of the standard Virto base.

/** The shared codebase, identical across every market instance. */
function largeCustomization(): CustomizationResult {
  const H = "In-house Team"; // the customer's internal digital & technology team
  const items: ComponentDto[] = [
    // ── Virto Cloud (infrastructure) ──
    { id: "d_aks", name: "Azure Kubernetes Service", group: "cloud", level: 0, azureService: "AKS", version: "1.32.9", owner: "Virto" },
    { id: "d_afd", name: "Front Door + WAF", group: "cloud", level: 0, azureService: "AFD Premium + WAF", owner: "Virto" },
    { id: "d_sql", name: "Azure SQL (per market)", group: "cloud", level: 0, azureService: "Azure SQL", version: "12.0", owner: "Virto", note: "One isolated database per market — no geo-replication between markets." },
    { id: "d_redis", name: "Azure Managed Redis", group: "cloud", level: 0, azureService: "Redis", version: "7.4", owner: "Virto" },
    { id: "d_search", name: "Azure AI Search", group: "cloud", level: 0, azureService: "Azure AI Search", owner: "Virto" },
    { id: "d_kv", name: "Key Vault", group: "cloud", level: 0, azureService: "Azure Key Vault", owner: "Virto" },
    { id: "d_blob", name: "Blob Storage assets", group: "cloud", level: 0, azureService: "Azure Blob Storage", owner: "Virto" },
    { id: "d_ai", name: "Monitoring / App Insights", group: "cloud", level: 0, azureService: "Azure Monitor", owner: "Virto" },
    { id: "d_argo", name: "Argo CD · vc-build CI/CD", group: "cloud", level: 0, owner: "Virto" },
    { id: "d_aad", name: "Azure AD SSO", group: "cloud", level: 1, azureService: "Entra ID", owner: "Virto + client", note: "Configured for the customer's corporate identity." },
    { id: "d_deploy", name: "Multi-market deployment", group: "cloud", level: 2, owner: H, note: "One codebase templated to 25 independent market instances across 13 Azure regions." },

    // ── Virto Commerce platform — one row per capability, coloured by the deepest
    //    customization present. EXTENDED (2) = a Custom.* module extends the standard one.
    { id: "d_core", name: "Commerce Core", group: "commerce", level: 2, owner: H, note: "Custom.Core / Custom.Commerce" },
    { id: "d_cat", name: "Catalog", group: "commerce", level: 2, owner: H, note: "Custom.Catalog" },
    { id: "d_cart", name: "Cart", group: "commerce", level: 2, owner: H, note: "Custom.Cart" },
    { id: "d_ord", name: "Orders", group: "commerce", level: 2, owner: H, note: "Custom.Order" },
    { id: "d_cust", name: "Customer", group: "commerce", level: 2, owner: H, note: "Custom.Customers" },
    { id: "d_mkt", name: "Marketing", group: "commerce", level: 2, owner: H, note: "Custom.Marketing" },
    { id: "d_inv", name: "Inventory", group: "commerce", level: 2, owner: H, note: "Custom.Inventory" },
    { id: "d_price", name: "Pricing", group: "commerce", level: 2, owner: H, note: "Custom.Pricing" },
    { id: "d_cms", name: "Content / CMS", group: "commerce", level: 2, owner: H, note: "Custom.CMS" },
    { id: "d_store", name: "Store", group: "commerce", level: 2, owner: H, note: "Custom.Store" },
    { id: "d_notif", name: "Notifications", group: "commerce", level: 2, owner: H, note: "Custom.Notifications" },
    { id: "d_pay", name: "Payment", group: "commerce", level: 2, owner: H, note: "Custom.Payments" },
    { id: "d_tax", name: "Tax", group: "commerce", level: 2, owner: H, note: "Custom.Taxes" },
    { id: "d_sidx", name: "Search Index", group: "commerce", level: 2, owner: H, note: "Custom Azure Search extension" },
    { id: "d_ei", name: "Export / Import", group: "commerce", level: 2, owner: H, note: "Custom.ExportImport" },
    { id: "d_sec", name: "Security", group: "commerce", level: 2, owner: H, note: "Custom.Security" },
    // CUSTOM (3) = net-new modules with no standard counterpart.
    { id: "d_loyal", name: "Loyalty", group: "commerce", level: 3, owner: H, note: "Custom.Loyalty" },
    { id: "d_help", name: "Helpdesk", group: "commerce", level: 3, owner: H, note: "Custom.Helpdesk" },
    { id: "d_hol", name: "Trading Calendar", group: "commerce", level: 3, owner: H, note: "Custom.Holidays" },
    { id: "d_erp", name: "ERP Integration", group: "commerce", level: 3, owner: H, note: "Custom.Integration" },
    { id: "d_rec", name: "Product Recommendations", group: "commerce", level: 3, owner: H, note: "Custom.ProductRecommendations" },
    { id: "d_load", name: "Initial Load Utility", group: "commerce", level: 3, owner: H, note: "Custom.InitialLoadUtility" },
    { id: "d_sms", name: "SMS Providers", group: "commerce", level: 3, owner: H, note: "Custom.SmsProviders" },
    // STANDARD (0) = present, no custom extension.
    { id: "d_xapi", name: "GraphQL XAPI", group: "commerce", level: 0 },
    { id: "d_assets", name: "Assets Management", group: "commerce", level: 0 },
    { id: "d_ship", name: "Shipping", group: "commerce", level: 0 },
    { id: "d_ga4", name: "Google Analytics 4", group: "commerce", level: 0 },
    { id: "d_pers", name: "Catalog Personalization", group: "commerce", level: 0 },
    { id: "d_bulk", name: "Bulk Actions", group: "commerce", level: 0 },
  ];
  return { dataSource: "sample", items };
}

/** LARGE — B2B, 25 independent market instances on the nearest Azure regions. */
function large(): DemoPreset {
  const model = clone(mockModel);
  model.platform = { name: "Virto Commerce", version: "3.832.15" };
  model.project = {
    customer: { title: "Large", logoUrl: "" },
    partner: { name: "In-house Team", website: "", logoUrl: "" },
  };
  model.tenants = [
    { id: "europe", name: "Europe", cloud: "Microsoft Azure", description: "5 European markets, each an independent instance on the nearest EU Azure region." },
    { id: "amee", name: "Africa & Middle East", cloud: "Microsoft Azure", description: "7 Africa / Middle East / Eastern-Europe markets on the nearest regional Azure DC." },
    { id: "apac", name: "APAC", cloud: "Microsoft Azure", description: "8 Asia-Pacific markets spanning Southeast Asia, East Asia, India and Australia." },
    { id: "americas", name: "Americas", cloud: "Microsoft Azure", description: "5 Latin-America / Caribbean markets on the nearest US Azure region." },
  ];
  // 25 markets — each an independent instance on the nearest Azure region.
  model.regions = [
    { id: "hop", name: "Netherlands", city: "West Europe · local R/W · 2020", lat: 52.37, lon: 4.9, tenantId: "europe", role: "local-rw", tzOffset: 1, weight: 0.8 },
    { id: "hungary", name: "Hungary", city: "Poland Central · local R/W · 2022", lat: 47.5, lon: 19.04, tenantId: "europe", role: "local-rw", tzOffset: 1, weight: 0.6 },
    { id: "greece", name: "Greece", city: "Italy North · local R/W · 2022", lat: 37.98, lon: 23.73, tenantId: "europe", role: "local-rw", tzOffset: 2, weight: 0.6 },
    { id: "czechia", name: "Czechia", city: "Germany West Central · local R/W · 2023", lat: 50.08, lon: 14.44, tenantId: "europe", role: "local-rw", tzOffset: 1, weight: 0.55 },
    { id: "italy", name: "Italy", city: "Italy North · local R/W · 2024", lat: 41.9, lon: 12.5, tenantId: "europe", role: "local-rw", tzOffset: 1, weight: 0.5 },
    { id: "rwanda", name: "Rwanda", city: "South Africa North · local R/W · 2019", lat: -1.94, lon: 30.06, tenantId: "amee", role: "local-rw", tzOffset: 2, weight: 0.9 },
    { id: "nigeria", name: "Nigeria", city: "Italy North · local R/W · 2019", lat: 6.52, lon: 3.38, tenantId: "amee", role: "local-rw", tzOffset: 1, weight: 0.9 },
    { id: "egypt", name: "Egypt", city: "Qatar Central · local R/W · 2019", lat: 30.04, lon: 31.24, tenantId: "amee", role: "local-rw", tzOffset: 2, weight: 0.9 },
    { id: "mozambique", name: "Mozambique", city: "South Africa North · local R/W · 2019", lat: -25.97, lon: 32.58, tenantId: "amee", role: "local-rw", tzOffset: 2, weight: 0.9 },
    { id: "ethiopia", name: "Ethiopia", city: "Qatar Central · local R/W · 2020", lat: 9.03, lon: 38.74, tenantId: "amee", role: "local-rw", tzOffset: 3, weight: 0.8 },
    { id: "reunion", name: "Reunion", city: "South Africa North · local R/W · 2023", lat: -20.88, lon: 55.45, tenantId: "amee", role: "local-rw", tzOffset: 4, weight: 0.55 },
    { id: "southafrica", name: "South Africa", city: "South Africa North · local R/W · 2024", lat: -26.2, lon: 28.05, tenantId: "amee", role: "local-rw", tzOffset: 2, weight: 0.5 },
    { id: "singapore", name: "Singapore", city: "Southeast Asia · local R/W · 2018", lat: 1.35, lon: 103.82, tenantId: "apac", role: "local-rw", tzOffset: 8, weight: 1.0 },
    { id: "indonesia", name: "Indonesia", city: "Southeast Asia · local R/W · 2018", lat: -6.21, lon: 106.85, tenantId: "apac", role: "local-rw", tzOffset: 7, weight: 1.0 },
    { id: "vietnam", name: "Vietnam", city: "East Asia · local R/W · 2020", lat: 21.03, lon: 105.85, tenantId: "apac", role: "local-rw", tzOffset: 7, weight: 0.8 },
    { id: "malaysia", name: "Malaysia", city: "Southeast Asia · local R/W · 2020", lat: 3.14, lon: 101.69, tenantId: "apac", role: "local-rw", tzOffset: 8, weight: 0.8 },
    { id: "newzealand", name: "New Zealand", city: "Australia East · local R/W · 2021", lat: -36.85, lon: 174.76, tenantId: "apac", role: "local-rw", tzOffset: 12, weight: 0.7 },
    { id: "newcaledonia", name: "New Caledonia", city: "Australia East · local R/W · 2022", lat: -22.28, lon: 166.46, tenantId: "apac", role: "local-rw", tzOffset: 11, weight: 0.6 },
    { id: "myanmar", name: "Myanmar", city: "South India · local R/W · 2022", lat: 16.87, lon: 96.2, tenantId: "apac", role: "local-rw", tzOffset: 6, weight: 0.6 },
    { id: "india", name: "India", city: "West India · local R/W · 2023", lat: 19.08, lon: 72.88, tenantId: "apac", role: "local-rw", tzOffset: 5, weight: 0.55 },
    { id: "panama", name: "Panama", city: "South Central US · local R/W · 2021", lat: 8.98, lon: -79.52, tenantId: "americas", role: "local-rw", tzOffset: -5, weight: 0.7 },
    { id: "bahamas", name: "Bahamas", city: "East US 2 · local R/W · 2021", lat: 25.06, lon: -77.35, tenantId: "americas", role: "local-rw", tzOffset: -5, weight: 0.7 },
    { id: "saintlucia", name: "Saint Lucia", city: "East US 2 · local R/W · 2021", lat: 14.01, lon: -60.99, tenantId: "americas", role: "local-rw", tzOffset: -4, weight: 0.7 },
    { id: "haiti", name: "Haiti", city: "East US 2 · local R/W · 2022", lat: 18.59, lon: -72.31, tenantId: "americas", role: "local-rw", tzOffset: -5, weight: 0.6 },
    { id: "jamaica", name: "Jamaica", city: "East US 2 · local R/W · 2022", lat: 18.02, lon: -76.8, tenantId: "americas", role: "local-rw", tzOffset: -5, weight: 0.6 },
  ];
  // No relations between instances — each market is fully independent.
  model.connections = [];
  // 13 distinct Azure regions actually hosting the solution (closest to each market).
  model.datacenters = [
    { id: "westeurope", name: "West Europe", lat: 52.37, lon: 4.9, current: true },
    { id: "polandcentral", name: "Poland Central", lat: 52.23, lon: 21.01, current: true },
    { id: "italynorth", name: "Italy North", lat: 45.46, lon: 9.19, current: true },
    { id: "germanywestcentral", name: "Germany West Central", lat: 50.11, lon: 8.68, current: true },
    { id: "southafricanorth", name: "South Africa North", lat: -26.2, lon: 28.05, current: true },
    { id: "qatarcentral", name: "Qatar Central", lat: 25.29, lon: 51.53, current: true },
    { id: "southeastasia", name: "Southeast Asia", lat: 1.35, lon: 103.82, current: true },
    { id: "eastasia", name: "East Asia", lat: 22.28, lon: 114.16, current: true },
    { id: "australiaeast", name: "Australia East", lat: -33.87, lon: 151.21, current: true },
    { id: "southindia", name: "South India", lat: 13.08, lon: 80.27, current: true },
    { id: "westindia", name: "West India", lat: 19.08, lon: 72.88, current: true },
    { id: "southcentralus", name: "South Central US", lat: 29.42, lon: -98.49, current: true },
    { id: "eastus2", name: "East US 2", lat: 36.85, lon: -78.39, current: true },
  ];
  // Aggregate ceilings across all 25 markets (drives dashboard bubble/curve scale).
  model.metricMax = { requests: 9000, users: 45000, orders: 1500, instances: 60 };
  model.catalogSize = 8600; // B2B assortment (per-market, representative)
  return {
    model,
    customization: largeCustomization(),
    theme: {
      "--tl-red": "#83C500",
      "--tl-red-deep": "#5A9400",
      "--tl-red-bright": "#A8E24B",
      "--tl-red-soft": "rgba(131,197,0,0.15)",
    },
  };
}

const PRESETS: Record<string, () => DemoPreset> = {
  small,
  medium,
  large,
  extralarge,
};

/** The active demo preset (from ?demo=<name>), or null when not in demo mode. */
export const demoPreset: DemoPreset | null = (() => {
  if (typeof window === "undefined") return null;
  const name = new URLSearchParams(window.location.search).get("demo")?.toLowerCase();
  if (!name) return null;
  const factory = PRESETS[name];
  if (!factory) {
    console.warn(`[solution-map] unknown demo preset '${name}' — known: ${Object.keys(PRESETS).join(", ")}`);
    return null;
  }
  console.info(`[solution-map] DEMO MODE: ${name}`);
  return factory();
})();

/** Apply the preset's brand theme (CSS custom properties). Call once at startup. */
export function applyDemoTheme(): void {
  if (!demoPreset?.theme) return;
  for (const [prop, value] of Object.entries(demoPreset.theme)) {
    document.documentElement.style.setProperty(prop, value);
  }
}
