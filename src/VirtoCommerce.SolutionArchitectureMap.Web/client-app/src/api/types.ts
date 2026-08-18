// ============================================================================
// API contract — exact camelCase mirror of Core/Models (see spec §4).
// Endpoints: /model · /customization · /metrics · /status
// ============================================================================
export type MetricKey = "requests" | "users" | "orders" | "instances";
export type DataSource = "sample" | "live";
export type RegionRole = "master-write" | "read-replica" | "read-cache" | "local-rw";

export interface TenantDto {
  id: string;
  name: string;
  cloud: string;
  description: string;
}

export interface RegionDto {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  tenantId: string;
  role: RegionRole;
  master?: boolean;
  /** UTC offset (hours) — drives the follow-the-sun diurnal curve. */
  tzOffset: number;
  /** Relative traffic scale vs the master region (0..1). */
  weight: number;
  /** Operational health of this region's deployment (marker color); defaults to healthy. */
  health?: "healthy" | "degraded" | "down";
}

export interface ConnectionDto {
  from: string;
  to: string;
  type: "replication" | "mutation" | "syncer";
}

export interface ComponentDto {
  id: string;
  name: string;
  group: "cloud" | "commerce";
  /** 0 standard · 1 configured · 2 extended · 3 custom. */
  level: 0 | 1 | 2 | 3;
  owner?: string;
  azureService?: string;
  version?: string;
  note?: string;
}

export interface ServiceStatusDto {
  componentId: string;
  state: "healthy" | "degraded" | "down";
  latencyMs?: number | null;
}

/** Project branding, loaded server-side from the SolutionArchitectureMap.ProjectInfo setting. */
export interface ProjectInfo {
  customer: CustomerInfo;
  partner: PartnerInfo;
}
export interface CustomerInfo {
  title: string;
  logoUrl: string;
}
export interface PartnerInfo {
  name: string;
  website: string;
  logoUrl: string;
}

/** A Virto Cloud datacenter location (hosting option). */
export interface DatacenterDto {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** True when the current solution is hosted in this datacenter. */
  current: boolean;
}

export interface SolutionMapModel {
  dataSource: DataSource;
  platform: { name: string; version: string };
  project: ProjectInfo;
  tenants: TenantDto[];
  regions: RegionDto[];
  connections: ConnectionDto[];
  datacenters: DatacenterDto[];
  metricMax: Record<MetricKey, number>;
  /** Product count from the search index; null/undefined when unavailable. */
  catalogSize?: number | null;
}

export interface CustomizationResult {
  dataSource: DataSource;
  items: ComponentDto[];
}

export interface MetricPoint {
  ts: string;
  value: number;
}
export interface MetricSeries {
  regionId: string;
  points: MetricPoint[];
}
export interface MetricsResult {
  dataSource: DataSource;
  metric: MetricKey;
  series: MetricSeries[];
}

export interface StatusResult {
  dataSource: DataSource;
  statuses: ServiceStatusDto[];
}

/** Everything the UI needs at startup (statuses re-polled separately). */
export interface SolutionData {
  model: SolutionMapModel;
  customization: CustomizationResult;
  statuses: StatusResult;
  /** true when any piece fell back to bundled sample data */
  usedFallback: boolean;
}
