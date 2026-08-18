// Node knowledge base for the info panel, ported verbatim from the engine's NODES object.
// The <strong> markup inside `desc` is app-authored (static literals) and safe to render.

export interface CatalogNode {
  title: string;
  azure?: string;
  desc: string;
  tags?: string[];
  link?: string;
}

export const NODE_CATALOG: Record<string, CatalogNode> = {
  afd: { title: "Azure Front Door", azure: "AFD Premium + WAF", desc: "Global edge entry point. Premium tier with <strong>Web Application Firewall</strong> and DDoS mitigation, routing traffic to the nearest healthy AKS cluster.", tags: ["Premium tier", "WAF", "DDoS", "TLS termination"] },
  nginx: { title: "Nginx Ingress", azure: "AKS ingress controller", desc: "In-cluster ingress that load-balances requests to the backend workloads.", tags: ["Ingress", "Load balancing"] },
  bff: { title: "Backend for Frontend", azure: "AKS workload · Virto runtime", desc: "The storefront-facing API host. Serves the Vue 3 frontend through GraphQL XAPI.", tags: ["Virto runtime", "XAPI host", ".NET 10"] },
  admin: { title: "Backend for Admin", azure: "AKS workload · Virto runtime", desc: "Hosts the administration application and management APIs.", tags: ["Admin SPA", "Management API"] },
  jobs: { title: "Backend for Jobs", azure: "AKS workload · Virto runtime", desc: "Runs background processing and scheduled work, decoupled from request traffic.", tags: ["Background jobs", "Hangfire host"] },
  sqlwrite: { title: "Azure SQL — Master Write", azure: "Azure SQL · geo-primary", desc: "The single source of truth. <strong>All mutations across every region land here</strong> and replicate outward to read replicas.", tags: ["Master write", "Geo-primary", "12.0"] },
  sqlcn: { title: "Azure SQL — China", azure: "Azure SQL (21Vianet)", desc: "Local read/write database inside the China tenant for data-residency. Selected tables sync with the US master via the DB Syncer.", tags: ["Local R/W", "Data residency", "12.0"] },
  sqlreplica: { title: "Azure SQL — Read Replica", azure: "Azure SQL · geo-replica", desc: "A regional read-only replica that serves low-latency reads. Kept current by Azure SQL geo-replication.", tags: ["Read-only", "Geo-replica", "Low latency"] },
  redis: { title: "Azure Managed Redis", azure: "Azure Cache for Redis", desc: "Regional cache for sessions and hot data.", tags: ["Cache", "7.4"] },
  redisgeo: { title: "Azure Managed Redis (geo)", azure: "Redis · active geo-replication", desc: "Globally replicated cache with <strong>active geo-replication</strong> so cached data is consistent across regions.", tags: ["Active geo-replication", "7.4"] },
  es: { title: "Elasticsearch", azure: "Virto-managed open-source", desc: "Search index powering catalog and product discovery. Data is synchronized from the US to the China datacenter.", tags: ["Search", "8.19.7", "US→CN sync"] },
  keyvault: { title: "Azure Key Vault", azure: "Azure Key Vault", desc: "Secrets, keys and certificates. Access is governed by <strong>RBAC with least privilege</strong>.", tags: ["Secrets", "RBAC", "cert-manager"] },
  appinsights: { title: "Application Insights", azure: "Azure Monitor", desc: "Telemetry, distributed tracing and alerting feeding the operations dashboards.", tags: ["Telemetry", "Alerting", "SLI/SLO"] },
  syncer: { title: "Virto DB Syncer", azure: "China ⇄ US controlled bridge", desc: "A Virto component deployed in China that performs <strong>bi-directional synchronization of selected databases</strong> between the China and US datacenters — the only sanctioned crossing of the compliance boundary.", tags: ["Bi-directional", "Selective sync", "Compliance bridge"] },
  hangfire: { title: "Hangfire", azure: "Async write queue", desc: "Any write originating in code is enqueued as an async task, smoothing load on the master write region.", tags: ["Async", "Background", "Resilience"] },
  vue: { title: "Vue 3 Frontend", azure: "Vite · storefront-less SPA", desc: "A modern <strong>storefront-less</strong> single-page app that talks GraphQL directly to XAPI. Static assets served via Front Door / Blob CDN.", tags: ["Vue 3", "Vite", "GraphQL client"] },
  xapi: { title: "GraphQL Experience API (XAPI)", azure: "xCatalog · xCart · xOrder · xCMS", desc: "The Experience API aggregates platform modules into a single GraphQL endpoint tuned for the frontend. The <strong>GEO WCP</strong> routes queries to local replicas and mutations to the master region.", tags: ["GraphQL", "xCatalog", "xCart", "xOrder"] },
  xapius: { title: "XAPI.US — Mutation endpoint", azure: "Master region API", desc: "All write operations funnel to the US Experience API, which commits to the master write database.", tags: ["Mutations", "Master region"] },
  efcore: { title: "EF Core → Azure SQL", azure: ".NET 10 · EF Core 10", desc: "The platform persistence layer. Modular Atomic Architecture (Module.Core / Module.Data / Module.Web) maps to the database via EF Core.", tags: [".NET 10", "EF Core 10", "OpenIddict"] },
  luminos: { title: "Implementation Partner", azure: "Systems Integrator", desc: "The customer’s implementation partner — designs, builds and maintains the <strong>custom modules</strong> (≈20% tailored layer) on top of the standard Virto base.", tags: ["Implementation partner", "Custom modules"], link: "" },
};
