// Region internals config (tiers of nodes), ported verbatim from the engine's REGIONS.
// The engine built these via a shared template R(over); here each region's config is
// expanded to a plain object (shared defaults for edge/aks/data/ops, overridden per region).

export interface RegionNode {
  key: string;
  label: string;
  azure?: string;
  ver?: string;
  cls?: string;
}
export interface RegionInternals {
  lead: string;
  edge: RegionNode[];
  aks: RegionNode[];
  data: RegionNode[];
  ops: RegionNode[];
}

export const VER = {
  aks: "1.32.9",
  sql: "12.0",
  es: "8.19.7",
  redis: "7.4",
  nginx: "1.26.3",
  os: "Ubuntu 5.15.0-1091",
  afd: "Premium + WAF",
} as const;

export const REGION_INTERNALS: Record<string, RegionInternals> = {
  eastus2: {
    lead: "The master write region. All mutations across the fleet land here, run through Hangfire, then replicate outward. Hosts admin and background jobs.",
    edge: [{ key: "afd", label: "Azure Front Door", azure: "AFD Premium + WAF", ver: VER.afd }],
    aks: [
      { key: "nginx", label: "Nginx Ingress", azure: "AKS ingress", ver: VER.nginx },
      { key: "bff", label: "Backend for Frontend", azure: "AKS workload", ver: VER.os, cls: "virto" },
      { key: "admin", label: "Backend for Admin", azure: "AKS workload", ver: VER.os, cls: "virto" },
      { key: "jobs", label: "Backend for Jobs", azure: "AKS workload", ver: VER.os, cls: "virto" },
    ],
    data: [
      { key: "sqlwrite", label: "Azure SQL · Read/Write", azure: "Azure SQL · geo-primary", ver: VER.sql, cls: "write" },
      { key: "redisgeo", label: "Azure Managed Redis", azure: "Redis · active geo-replication", ver: VER.redis },
      { key: "es", label: "Elasticsearch", azure: "Virto-managed", ver: VER.es },
      { key: "hangfire", label: "Hangfire", azure: "Async write queue", ver: "", cls: "virto" },
    ],
    ops: [
      { key: "keyvault", label: "Key Vault", azure: "Azure Key Vault" },
      { key: "appinsights", label: "Application Insights", azure: "Azure Monitor" },
    ],
  },
  china: {
    lead: "Runs in the isolated 21Vianet tenant. Writes locally for data residency, reads from East Asia, and bi-directionally syncs selected databases with the US via the Virto DB Syncer.",
    edge: [{ key: "afd", label: "Azure Front Door", azure: "AFD Premium + WAF", ver: VER.afd }],
    aks: [
      { key: "nginx", label: "Nginx Ingress", azure: "AKS ingress", ver: VER.nginx },
      { key: "bff", label: "Backend for Frontend", azure: "AKS workload", ver: VER.os, cls: "virto" },
      { key: "admin", label: "Backend for Admin", azure: "AKS workload", ver: VER.os, cls: "virto" },
    ],
    data: [
      { key: "sqlcn", label: "Azure SQL · Read/Write", azure: "Azure SQL (China)", ver: VER.sql, cls: "write" },
      { key: "redis", label: "Azure Managed Redis", azure: "Redis", ver: VER.redis },
      { key: "es", label: "Elasticsearch", azure: "Virto-managed · synced from US", ver: VER.es },
      { key: "syncer", label: "Virto DB Syncer", azure: "China ⇄ US bridge", ver: "", cls: "custom" },
    ],
    ops: [
      { key: "keyvault", label: "Key Vault", azure: "Azure Key Vault" },
      { key: "appinsights", label: "Application Insights", azure: "Azure Monitor" },
    ],
  },
  japan: {
    lead: "A read-only region. Serves Japanese traffic from a local Azure SQL geo-replica with a regional Redis cache; mutations route to East US 2.",
    edge: [{ key: "afd", label: "Azure Front Door", azure: "AFD Premium + WAF", ver: VER.afd }],
    aks: [
      { key: "nginx", label: "Nginx Ingress", azure: "AKS ingress", ver: VER.nginx },
      { key: "bff", label: "Backend for Frontend", azure: "AKS workload", ver: VER.os, cls: "virto" },
    ],
    data: [
      { key: "sqlreplica", label: "Azure SQL · Read replica", azure: "Azure SQL", ver: VER.sql },
      { key: "redis", label: "Azure Managed Redis", azure: "Redis", ver: VER.redis },
    ],
    ops: [],
  },
  germany: {
    lead: "A read-only region. Serves European traffic from a local Azure SQL geo-replica with a regional Redis cache; mutations route to East US 2.",
    edge: [{ key: "afd", label: "Azure Front Door", azure: "AFD Premium + WAF", ver: VER.afd }],
    aks: [
      { key: "nginx", label: "Nginx Ingress", azure: "AKS ingress", ver: VER.nginx },
      { key: "bff", label: "Backend for Frontend", azure: "AKS workload", ver: VER.os, cls: "virto" },
    ],
    data: [
      { key: "sqlreplica", label: "Azure SQL · Read replica", azure: "Azure SQL", ver: VER.sql },
      { key: "redis", label: "Azure Managed Redis", azure: "Redis", ver: VER.redis },
    ],
    ops: [],
  },
  // Generic template for an independent, self-contained market instance (e.g. the Large preset):
  // full read/write on its own Azure SQL + Redis, no cross-region replication.
  standalone: {
    lead: "An independent market instance — full read/write on its own Azure SQL and Redis, with no cross-region replication. Runs the same shared codebase as every other market, deployed to the nearest Azure region.",
    edge: [{ key: "afd", label: "Azure Front Door", azure: "AFD Premium + WAF", ver: VER.afd }],
    aks: [
      { key: "nginx", label: "Nginx Ingress", azure: "AKS ingress", ver: VER.nginx },
      { key: "bff", label: "Backend for Frontend", azure: "AKS workload", ver: VER.os, cls: "virto" },
      { key: "admin", label: "Backend for Admin", azure: "AKS workload", ver: VER.os, cls: "virto" },
      { key: "jobs", label: "Backend for Jobs", azure: "AKS workload", ver: VER.os, cls: "virto" },
    ],
    data: [
      { key: "sqlwrite", label: "Azure SQL · Read/Write", azure: "Azure SQL · single region", ver: VER.sql, cls: "write" },
      { key: "redis", label: "Azure Managed Redis", azure: "Redis", ver: VER.redis },
      { key: "search", label: "Azure AI Search", azure: "Azure AI Search", ver: "" },
    ],
    ops: [
      { key: "keyvault", label: "Key Vault", azure: "Azure Key Vault" },
      { key: "appinsights", label: "Application Insights", azure: "Azure Monitor" },
    ],
  },
  eastasia: {
    lead: "A lightweight read/cache region. Provides the read source the China tenant draws from, plus a regional Redis cache.",
    edge: [],
    aks: [{ key: "bff", label: "Backend for Frontend", azure: "AKS workload", ver: VER.os, cls: "virto" }],
    data: [
      { key: "sqlreplica", label: "Azure SQL · Read replica", azure: "Azure SQL · read source for CN", ver: VER.sql },
      { key: "redis", label: "Azure Managed Redis", azure: "Redis", ver: VER.redis },
    ],
    ops: [],
  },
};
