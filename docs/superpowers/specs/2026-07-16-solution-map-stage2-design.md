# Solution Architecture Map — Stage 2 Design (Production Module)

Date: 2026-07-16
Status: approved in brainstorming session
Repo: `vc-module-solution-architecture-map` (`VirtoCommerce.SolutionArchitectureMap`, platformVersion 3.1039.0)

## 1. Context & current state (verified)

Stage 1 shipped and was verified against a running platform (`https://localhost:5001`):

- Vue 3 + Vite app in `src/VirtoCommerce.SolutionArchitectureMap.Web/client-app/`, building into
  `Web/Content/solution-architecture-map/` (the platform serves each manifest `<app>` from
  `{module}/Content/{appId}` at `/apps/{appId}` and fails startup if missing).
- The app is a near-verbatim port of the `thorlabs-cloud-map.html` prototype: one 45 KB engine
  (`src/engine/solutionMap.js`, wrapped as `initSolutionMap()`), raw markup
  (`src/engine/markup.html`), CSS (`src/styles/map.css`). It renders the full experience
  (world map, 4 drill-down layers, 24h time engine, connections card, customization heat map)
  from **bundled constants**.
- REST: `GET /api/solution-architecture-map/model` returns a mock `SolutionMapModel`
  (`SampleSolutionArchitectureMapService`), gated by `[Authorize("solution-architecture-map:access")]`
  (401 anonymous — verified). The Vue app fetches it but does not consume it yet; on 401 it
  falls back to bundled data with a console warning.
- Manifest declares `<apps><app id="solution-architecture-map">` with permission +
  `supportEmbeddedMode` → App Menu entry.
- The scaffold's AngularJS stub (`Web/Scripts/`, `webpack.config.js`, root `package.json`) is
  unused dead weight.

## 2. Goal

Bring the module to **marketplace/production grade**:

1. Engine consumes API data (single source of truth = API).
2. Same-origin cookie auth for all API calls.
3. API refactored into 4 endpoints (topology / customization / metrics / status).
4. Full scene-by-scene Vue componentization; delete the monolithic engine.
5. First live provider (installed-modules → heat map), packaging/CI hygiene, tests, docs.

## 3. Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| D1 | Quality bar | Production module (marketplace-grade) |
| D2 | API shape | 4 endpoints, polling (no SignalR in this stage) |
| D3 | Auth | Same-origin platform cookie (`credentials: "same-origin"`); no token plumbing |
| D4 | Std-vs-custom classification | Author heuristic (`Virto Commerce` → standard) + platform-setting overrides |
| D5 | Refactor depth | Full componentization, ported scene-by-scene with parity checks |
| D6 | Execution order | Contract-first strangler (API → parametrized engine → components → live provider → hygiene) |

## 4. REST API

Base `/api/solution-architecture-map`. All actions `[Authorize(ModuleConstants.Security.Permissions.Access)]`,
documented in Swagger. Every response carries `dataSource: "sample" | "live"` — the UI renders its
"sample data" badge from it.

### 4.1 `GET /model` — topology (server cache ~5 min; client fetches once on load)

```jsonc
{
  "dataSource": "sample",
  "platform": { "name": "Virto Commerce", "version": "3.1039.0" },
  "tenants":  [ { "id", "name", "cloud", "description" } ],
  "regions":  [ {
      "id", "name", "city", "lat", "lon", "tenantId",
      "role": "master-write|read-replica|read-cache|local-rw",
      "master": true, "tzOffset": -4, "weight": 1.0
  } ],
  "connections": [ { "from", "to", "type": "replication|mutation|syncer" } ],
  "metricMax": { "requests": 2400, "users": 12000, "orders": 280, "instances": 18 }
}
```

Change from Stage 1: `components` and `statuses` **move out** of `SolutionMapModel` to their own
endpoints.

### 4.2 `GET /customization` — heat-map inventory (server cache ~5 min)

```jsonc
{
  "dataSource": "live",
  "items": [ {
      "id", "name",
      "group": "cloud|commerce",
      "level": 0,            // 0 standard · 1 configured · 2 extended · 3 custom
      "owner": "Virto",      // optional
      "azureService": "AKS", // optional
      "version": "1.32.9",   // optional
      "note": "..."          // optional
  } ]
}
```

### 4.3 `GET /metrics?metric={key}&from={iso}&to={iso}&granularity={minutes}` (client cache ~60 s)

`metric`: `requests | users | orders | instances`. Default window: last 24 h, granularity 30.

```jsonc
{
  "dataSource": "sample",
  "metric": "requests",
  "series": [ { "regionId": "eastus2", "points": [ { "ts": "2026-07-16T00:00:00Z", "value": 810 } ] } ]
}
```

The **server** generates the series (mock = the prototype's timezone-aware diurnal curves computed
server-side from region `tzOffset`/`weight` + `metricMax`). The UI interpolates between points for
smooth animation. Real telemetry later replaces the generator without UI changes.

### 4.4 `GET /status` — live service status (no cache; client polls ~15 s)

```jsonc
{
  "dataSource": "sample",
  "statuses": [ { "componentId": "h_sql", "state": "healthy|degraded|down", "latencyMs": 12 } ]
}
```

### 4.5 TypeScript mirror

`client-app/src/api/types.ts` remains the exact camelCase mirror of the C# DTOs.
`client-app/src/api/client.ts` exposes `getModel() / getCustomization() / getMetrics(q) / getStatus()`;
dev mode (`import.meta.env.DEV` or `VITE_USE_MOCK=true`) serves from `api/mock.ts` so `vite dev`
runs standalone.

## 5. Backend design

### 5.1 Provider interfaces (`Core/Services/`)

```csharp
ISolutionTopologyProvider   { Task<SolutionMapModel>       GetTopologyAsync(); }
ICustomizationProvider      { Task<CustomizationResult>    GetCustomizationAsync(); }
IMetricsProvider            { Task<MetricsResult>          GetMetricsAsync(MetricsQuery query); }
IServiceStatusProvider      { Task<StatusResult>           GetStatusesAsync(); }
```

`ISolutionArchitectureMapService` (Stage 1) is removed; the controller composes the four providers.

### 5.2 Sample providers (`Web/Services/`)

`SampleTopologyProvider`, `SampleMetricsProvider`, `SampleStatusProvider` port the current mock
data 1:1 (visual behavior preserved). `SampleMetricsProvider` implements the diurnal generator:

```
value(region, t) = metricMax[metric] × region.weight × diurnal(localHour(t, region.tzOffset))
diurnal(h) = clamp(0.04..1, 1.16 × (0.14 + 0.86 × (0.74·g(13,3.4) + 0.46·g(20,2.1))))   // as prototype
instances floor 3; orders series is the rate (UI integrates for the 24h cumulative KPI)
```

### 5.3 Live provider: `ManifestCustomizationProvider` (`Web/Services/`)

Replaces the sample customization provider in DI. Algorithm:

1. Enumerate installed modules via `ILocalModuleCatalog`/`IModuleCatalog` (id, title, version, authors).
2. Heuristic: any author/owner equal to `"Virto Commerce"` (case-insensitive) → `level 0`,
   `owner "Virto"`; otherwise → `level 3`, `owner` = first author or `"Custom"`.
3. Merge overrides from platform setting **`SolutionArchitectureMap.CustomizationOverrides`**
   (JSON string; registered in `ModuleConstants.Settings` + `Module.cs`):
   ```jsonc
   { "VirtoCommerce.Pricing": { "level": 1, "note": "Driven by price-list config" },
     "MyCompany.Erp":         { "level": 3, "owner": "Luminos Labs" } }
   ```
   Override keys are **item ids** — the module id for commerce items (e.g. `VirtoCommerce.Pricing`)
   or the `h_*` id for infrastructure items (e.g. `h_syncer`); fields are optional
   (`level`, `owner`, `note`, `group`, `hidden`).
4. `group": "commerce"` for modules; the **infrastructure (cloud) items remain sourced from the
   sample inventory** in this stage (until the Virto Cloud infra API exists) — the response is
   the union, with `dataSource: "live"` when module enumeration succeeded.
5. Result cached 5 min (`IMemoryCache`); cache dropped on module list change is out of scope.

### 5.4 Controller

`SolutionArchitectureMapController` gains the three new actions; `[ProducesResponseType]` on all;
`MetricsQuery` validated (unknown metric → 400; `to<from` → 400; granularity 5–120 min).

## 6. Frontend design

### 6.1 Target structure

```
client-app/src/
├─ api/          types.ts · client.ts · mock.ts
├─ composables/  useSolutionModel.ts   // load /model + /customization once; expose reactive model
│                useTimeEngine.ts      // 24h clock: play/pause/scrub/speed; interpolates /metrics
│                useStatus.ts          // polls /status 15s; health rollup; last-known on failure
│                useSceneNav.ts        // scene stack, breadcrumb, drill in/out (Esc/back)
├─ components/
│  ├─ AppShell.vue                     // topbar, breadcrumb bar, bottom legend, info panel host
│  ├─ scenes/    WorldScene.vue · TenantsScene.vue · RegionScene.vue
│  │             PlatformScene.vue · HeatmapScene.vue
│  ├─ world/     WorldMap.vue          // SVG: land path, graticule, region nodes, flow arcs
│  │             DaylightBand.vue      // sliding day-band gradient
│  │             ConnectionsCard.vue   // interactive flow-focus card
│  │             MetricDashboard.vue   // play/scrub/speed, day chart, KPI row
│  ├─ shared/    StatusDot.vue · NodeCard.vue · InfoPanel.vue · SampleDataBadge.vue
├─ styles/       map.css (split per-component where natural; tokens stay global)
└─ engine/       DELETED at the end of this stage
```

### 6.2 Data flow

- `useSolutionModel` fetches `/model` + `/customization` on mount; failure → bundled mock +
  `dataSource:"sample"`; `SampleDataBadge` shown whenever any source is sample/fallback.
- `useTimeEngine` fetches `/metrics` for the active metric (24h window), holds the simulated
  clock, exposes `valueAt(regionId, minuteOfDay)` via interpolation; orders KPI integrates the
  series cumulatively (as today).
- `useStatus` polls; maps `componentId → state`; drives StatusDots, region coloring, health pill.
- Scenes are pure renderers over these composables; no scene owns fetch logic.

### 6.3 Port order & parity gate (strangler)

Engine stays functional throughout; each step replaces one scene and must pass the parity
checklist before the next begins:

1. AppShell + useSceneNav (chrome, breadcrumb, legend, info panel)
2. WorldScene (WorldMap + DaylightBand + ConnectionsCard + MetricDashboard + composables)
3. HeatmapScene (filters, ratio bar, tile detail — now fed by `/customization`)
4. RegionScene (tiers, AKS cluster, backend drill → PlatformScene)
5. TenantsScene · PlatformScene (arch/XAPI toggle)
6. Delete `engine/` + `markup.html`; final full-app parity pass

**Parity checklist** (DOM probes, per scene): world = 5 regions + land path + KPIs update with
scrub + flows animate + region click drills; heatmap = tile count, 77/23 ratio (sample), filters,
tile→info panel; region = tier layout, versions, backend→platform drill; tenants/platform =
toggle views, Luminos link; global = breadcrumb/back/Esc, health pill, no console errors,
`vue-tsc` strict passes.

## 7. Auth

All client calls: `fetch(url, { credentials: "same-origin" })`. Embedded (App Menu iframe) and
direct URL after back-office login both carry the platform auth cookie. 401/anonymous →
sample-data fallback + badge (never a broken UI). A postMessage token contract is explicitly
**out of scope** (documented as future work for cross-origin hosting).

Verification note: confirm cookie auth passes `[Authorize]` on the module controller in the
local platform early in implementation (single curl/browser check); if the platform rejects
cookie auth for API routes, fall back to decision D3-alt (postMessage token) — flagged as a risk,
not silently absorbed.

## 8. Packaging & hygiene

- **csproj integration** (`Web.csproj`): Release-build target runs `npm ci` + `npm run build`
  in `client-app/` before `Build`, so `vc-build Compress` always packs a fresh
  `Content/solution-architecture-map/`. Debug builds skip it (developers run `npm run dev`).
- **`module.ignore`**: exclude `client-app/` sources and `node_modules` from the module zip;
  `Content/solution-architecture-map/**` is included.
- **Remove AngularJS stub**: `Web/Scripts/`, `Web/webpack.config.js`, `Web/package.json`,
  `Web/package-lock.json` (manifest has no `<scripts>`/`<styles>` referencing them).
- **README.md** (repo root): what the module is, install, permission, settings
  (incl. `CustomizationOverrides` format), endpoint reference, dev workflow
  (`npm run dev` = standalone mock; symlink-into-modules dev loop; `Content/{appId}` serving rule).

## 9. Testing

- **xUnit** (`tests/…Tests`):
  - `ManifestCustomizationProviderTests` — heuristic (Virto author → 0, other → 3), override
    merge (level/owner/note/hidden), malformed override JSON → heuristic-only + logged warning.
  - `SampleMetricsProviderTests` — series shape, window/granularity handling, weights/tz applied.
  - `MetricsQueryValidationTests` — 400 paths.
  - Controller smoke: all four actions return contract shapes; `[Authorize]` attribute present.
- **Frontend**: `vue-tsc` strict in `npm run build`; parity checklist (§6.3) executed per scene
  port and recorded in the implementation plan as explicit verification steps.

## 10. Error handling matrix

| Failure | Behavior |
|---|---|
| `/model` or `/customization` fails/401 | Full sample fallback + badge; app fully usable |
| `/metrics` fails | Time engine runs on bundled sample curves + badge |
| `/status` poll fails | Keep last-known states + warning chip in health pill; retry next tick |
| Override setting malformed | Ignore overrides, log warning, heuristic-only result |
| Any endpoint slow | UI renders immediately from cache/sample; data swaps in when resolved |

No unhandled promise rejections; every fetch path has a catch.

## 11. Out of scope (Stage 2)

- Real Virto Cloud infrastructure API (topology/metrics/status stay sample; contracts ready).
- SignalR/streaming updates; alerting/incident workflows.
- Editing customization levels from the UI (JSON setting only).
- Localization of the app UI (single `en` for now; platform Localizations folder untouched).
- postMessage token hand-off (documented as future work).

## 12. Risks

| Risk | Mitigation |
|---|---|
| Cookie auth rejected for API routes | Early verification (§7); fallback = postMessage token |
| Componentization regressions | Strangler order + per-scene parity gate (§6.3) |
| `npm` in csproj slows/complicates CI | Release-only target; documented opt-out property |
| Author heuristic misclassifies | Overrides setting is the pressure valve; documented in README |
