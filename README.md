# Solution Architecture Map

## Overview

An installable Virto Commerce module that adds an **interactive solution architecture map** to the platform App Menu. It visualizes how a customer's solution is deployed across Virto Cloud and Virto Commerce as an explorable, animated "iceberg":

- **World layer** — real-geography map of the solution's Azure regions with animated data flows (SQL geo-replication, writes-to-master, cross-tenant sync), a 24-hour "follow the sun" time engine, and live per-region metrics (requests, active users, new orders, running instances).
- **Tenancy & compliance layer** — isolated tenants (e.g. Azure China / 21Vianet vs commercial Azure) and the controlled bridge between them.
- **Region layer** — inside each region: edge (Front Door + WAF), AKS workloads, data & search services, with versions and live status.
- **Platform layer** — inside Virto Commerce: storefront-less frontend → GraphQL XAPI → modules, with an Architecture ⇄ XAPI-request-flow toggle.
- **Customization heat map** — every component graded Standard / Configured / Extended / Custom, so the client always sees their customization surface vs the Virto-maintained base. Commerce items are enumerated **live from the installed modules**.

- **Reliability & incidents layer** — a customer-facing status view: active-incident card (severity + Investigating→Identified→Monitoring→Resolved stepper, plain-language impact, affected band, next-update time), business metrics (uptime, SLA, MTTA, MTTR), reliability trends, and a filterable incident history. The SPA reads this from the backend `IIncidentsProvider` (`GET /incidents`); an active incident automatically turns the affected region orange/red on the world map.

The Vue 3 app is served by the module and reads everything over a versioned REST API. Data sources are pluggable: sample providers ship in the box (the app is fully explorable out of the box), and each endpoint can be re-backed by live telemetry (e.g. a Virto Cloud infrastructure API) without UI changes — responses carry a `dataSource: "sample" | "live"` flag.

> **See [docs/architecture.md](docs/architecture.md)** for the full service map: every provider interface, what it's bound to today (setting / sample / live), the goal live source, and the one DI seam where you swap them.

## Installation

1. Build the module zip: `vc-build Compress` (produces `artifacts/VirtoCommerce.SolutionArchitectureMap_<version>.zip`), or take a released zip.
2. In the platform back office: **Modules → Advanced → Install/update from file**, then restart the platform.
3. Open the **App Menu** (waffle icon) → **Solution Architecture Map**.

> The platform serves the app from `{module}/Content/solution-architecture-map` at `/apps/solution-architecture-map` and **fails startup if that folder is missing** — it is produced automatically by Release builds (see Development).

## Security

Access is gated by the **`solution-architecture-map:access`** permission — it controls both the App Menu entry and every REST endpoint. Assign it to the roles that should see the map. (`:create/:read/:update/:delete` permissions are registered for future use.)

The app authenticates API calls with the platform's **same-origin auth cookie** — no extra configuration.

## Settings

| Setting | Type | Default | Purpose |
|---|---|---|---|
| `SolutionArchitectureMap.Enabled` | bool | `false` | Reserved feature flag. |
| `SolutionArchitectureMap.CustomizationOverrides` | JSON | `{}` | Per-item overrides for the customization heat map. |
| `SolutionArchitectureMap.ProjectInfo` | JSON | Default (anonymized) branding | Customer title/logo + implementation partner name/website/logo. |
| `SolutionArchitectureMap.Topology` | JSON | Reference architecture (anonymized) | The solution topology served by `GET /model`: platform, tenants, regions, connections, datacenters, metric ceilings (camelCase, same shape as the API payload). Empty/malformed falls back to the default. |

**CustomizationOverrides format** — a dictionary keyed by item id: the **module id** for commerce items (e.g. `VirtoCommerce.Pricing`) or the `h_*` id for infrastructure items (e.g. `h_syncer`). Fields (all optional): `level` (0 standard · 1 configured · 2 extended · 3 custom), `owner`, `note`, `group`, `hidden`.

```json
{
  "VirtoCommerce.Pricing": { "level": 1, "note": "Driven by price-list configuration" },
  "MyCompany.Erp": { "level": 3, "owner": "Implementation Partner" },
  "h_syncer": { "hidden": true }
}
```

Without overrides, installed modules are classified by an **author heuristic**: author `Virto Commerce` → Standard (level 0, owner "Virto"); anything else → Custom (level 3, owner = module author).

## Web API

Base route: `/api/solution-architecture-map` (all endpoints require `solution-architecture-map:access`; full schemas in Swagger):

| Endpoint | Purpose |
|---|---|
| `GET /model` | Solution topology: platform, tenants, regions (coordinates, timezone, role), connections, metric ceilings. |
| `GET /customization` | Standard-vs-custom inventory for the heat map (live installed modules + infrastructure items + overrides). |
| `GET /metrics?metric=&from=&to=&granularity=` | Per-region time series (`requests`, `users`, `orders`, `instances`); defaults to the last 24 h at 30-minute granularity; window capped at 2000 points per series. |
| `GET /status` | Live service statuses (`healthy`/`degraded`/`down` + latency); the app polls every 15 s. |
| `GET /incidents/active` | Currently open incidents (**there may be several**): severity, stage, plain-language impact, affected band, next-update time, update log. |
| `GET /incidents/history?skip=&take=&severities=&keyword=` | Resolved-incident history — filtered by severity/keyword and **paginated** (`totalCount` + `results`). |
| `GET /incidents/metrics` | Business metrics: KPIs (uptime, SLA, MTTA, MTTR) and reliability trends (incidents/month, MTTR series). |

Backend data flows through provider interfaces — `ISolutionTopologyProvider`, `ICustomizationProvider`, `IMetricsProvider`, `IServiceStatusProvider`, `IIncidentsProvider` (three methods: active incidents · paginated/filtered history · business metrics), all in `Core.Services`, plus the `ICatalogSizeReader` — registered in DI in `Web/Module.cs`. Replace any binding to feed live data without touching the API or UI. `GET /model` also carries the live catalog size (search-index `Product` count) and the running platform version. See **[docs/architecture.md](docs/architecture.md)**.

## Development

```bash
# Frontend (standalone, uses the in-repo mock — no platform needed)
cd src/VirtoCommerce.SolutionArchitectureMap.Web/client-app
npm install
npm run dev            # http://localhost:5173

# Frontend production build → Content/solution-architecture-map
npm run build

# Backend
dotnet build           # Debug: skips the npm build
dotnet build -c Release   # runs `npm ci` + `npm run build` automatically (opt out: -p:SkipClientApp=true)
dotnet test

# Package
vc-build Compress      # module zip; client-app sources and node_modules are excluded via module.ignore
```

Local platform dev loop: symlink the `Web` project folder into your platform's `modules` directory; C#/manifest changes need a platform restart, frontend changes only need `npm run build` + browser refresh.

### Demo mode (test the UI as different companies)

Client-side company presets for demos and UI testing — no backend changes needed:

```powershell
cd src/VirtoCommerce.SolutionArchitectureMap.Web/client-app
./demo.ps1 small        # or: npm run demo:small
./demo.ps1 medium       # or: npm run demo:medium
./demo.ps1 large        # or: npm run demo:large
./demo.ps1 extralarge   # or: npm run demo:extralarge
```

Presets are **anonymized by deployment size** (no real customer names):

| Preset | Scenario |
|---|---|
| `small` | single region (West Europe), no replications |
| `medium` | blue brand theme; East US (master) + West US replica kept in sync |
| `large` | 25 independent market instances, each on the nearest Azure region, one shared codebase, no cross-market replication |
| `extralarge` | the full reference architecture: 5 regions, China tenant + DB Syncer; the sample active incident (US region) surfaces here only |

The script starts the dev server (or reuses a running one) and opens `http://localhost:5173/?demo=<preset>`. The `?demo=` parameter also works against a live platform: `/apps/solution-architecture-map/?demo=medium`. Presets live in `client-app/src/api/demo.ts` — add your own by extending `PRESETS` (topology, project branding, and optional CSS-variable theme).

## License

Copyright (c) Virto Solutions LTD.  All rights reserved.

Licensed under the Virto Commerce Open Software License (the "License"); you
may not use this file except in compliance with the License. You may
obtain a copy of the License at

<https://virtocommerce.com/open-source-license>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.
