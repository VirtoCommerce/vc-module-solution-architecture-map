# Solution Architecture Map — Stage 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `VirtoCommerce.SolutionArchitectureMap` to production grade: 4-endpoint REST API (mock providers + first live provider), cookie auth, Vue app fully componentized and bound to the API, packaging/CI hygiene.

**Architecture:** Contract-first strangler (spec D6). Backend contracts + providers land first; the existing ported engine is parametrized to consume them (reference implementation); scenes are then extracted into Vue components one at a time with parity gates; the engine is deleted at the end; hygiene last. The app must build and render after **every** task.

**Tech Stack:** .NET 10 / ASP.NET Core (platform module), xUnit + FluentAssertions, Vue 3 + TypeScript + Vite.

**Spec:** `docs/superpowers/specs/2026-07-16-solution-map-stage2-design.md` (in this repo). Read it first.

**Working directory:** `c:\Projects\git\VirtoCommerce\vc-module-solution-architecture-map`

**Key paths** (all under `src/VirtoCommerce.SolutionArchitectureMap.`):
- `Core/` — models, provider interfaces, ModuleConstants
- `Web/` — controller, providers, Module.cs, manifest, `client-app/` (Vue), `Content/solution-architecture-map/` (build output — never edit by hand)
- `tests/VirtoCommerce.SolutionArchitectureMap.Tests/` — xUnit

**Verification commands** (used throughout):
- Backend: `dotnet build src/VirtoCommerce.SolutionArchitectureMap.Web/VirtoCommerce.SolutionArchitectureMap.Web.csproj` → `Build succeeded. 0 Warning(s) 0 Error(s)`
- Tests: `dotnet test tests/VirtoCommerce.SolutionArchitectureMap.Tests/VirtoCommerce.SolutionArchitectureMap.Tests.csproj`
- Frontend: `cd src/VirtoCommerce.SolutionArchitectureMap.Web/client-app && npm run build` (runs `vue-tsc -b` then vite) → must pass with 0 TS errors
- The user's platform (`https://localhost:5001`) serves the module via symlink `modules/_A` → the Web project folder; after `npm run build` a browser refresh of `/apps/solution-architecture-map/` picks up the new bundle. Platform restart only needed for C# / manifest changes.

**File-structure map (what this plan creates/deletes):**

```
Core/Models/     SolutionMapModel.cs (modified: −components −statuses)
                 CustomizationResult.cs · MetricsResult.cs · StatusResult.cs · MetricsQuery.cs   (new)
Core/Services/   ISolutionTopologyProvider.cs · ICustomizationProvider.cs
                 IMetricsProvider.cs · IServiceStatusProvider.cs                                  (new)
                 ISolutionArchitectureMapService.cs                                              (DELETED)
Core/ModuleConstants.cs (modified: +CustomizationOverrides setting)
Web/Services/    SampleData.cs · SampleTopologyProvider.cs · SampleMetricsProvider.cs
                 SampleStatusProvider.cs · ManifestCustomizationProvider.cs
                 IInstalledModulesReader.cs (+LocalInstalledModulesReader)
                 IOverridesReader.cs (+SettingsOverridesReader)                                   (new)
                 SampleSolutionArchitectureMapService.cs                                         (DELETED)
Web/Controllers/Api/SolutionArchitectureMapController.cs (rewritten: 4 actions)
Web/Module.cs (modified: DI)
Web/Scripts/, Web/webpack.config.js, Web/package.json, Web/package-lock.json                     (DELETED, Task 14)
Web/VirtoCommerce.SolutionArchitectureMap.Web.csproj (modified: npm build target)
client-app/src/api/       types.ts · client.ts · mock.ts (rewritten)
client-app/src/data/      infrastructureInventory.ts · regionInternals.ts (new — client-side presentational data)
client-app/src/composables/ useSolutionData.ts · useTimeEngine.ts · useStatus.ts · useSceneNav.ts (new)
client-app/src/components/  AppShell.vue · scenes/*.vue · world/*.vue · shared/*.vue (new)
client-app/src/engine/    solutionMap.js · markup.html (modified in Task 7, DELETED in Task 13)
```

---

## Phase A — Backend contracts (Tasks 0–6)

### Task 0: Baseline commit of Stage-1 code

The repo has exactly one commit (the spec). Commit the working Stage-1 state so every later task has a clean diff.

- [ ] **Step 1: Commit everything current**

```bash
cd c:/Projects/git/VirtoCommerce/vc-module-solution-architecture-map
git add -A
git commit -m "feat: Stage 1 — module scaffold, ported Vue map app, mock /model API"
```

- [ ] **Step 2: Verify clean tree and buildable baseline**

Run: `git status --porcelain` → empty.
Run: `dotnet build src/VirtoCommerce.SolutionArchitectureMap.Web/VirtoCommerce.SolutionArchitectureMap.Web.csproj` → `0 Warning(s) 0 Error(s)`.

---

### Task 1: Contract models (Core)

**Files:**
- Modify: `src/VirtoCommerce.SolutionArchitectureMap.Core/Models/SolutionMapModel.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Core/Models/CustomizationResult.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Core/Models/MetricsResult.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Core/Models/StatusResult.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Core/Models/MetricsQuery.cs`

- [ ] **Step 1: Trim `SolutionMapModel`**

In `SolutionMapModel.cs`, delete the two properties from class `SolutionMapModel` (keep the DTO classes `ComponentDto` and `ServiceStatusDto` in the file — they're used by the new result models):

```csharp
// DELETE these two lines from SolutionMapModel:
public IList<ComponentDto> Components { get; set; } = new List<ComponentDto>();
public IList<ServiceStatusDto> Statuses { get; set; } = new List<ServiceStatusDto>();
```

- [ ] **Step 2: Create `CustomizationResult.cs`**

```csharp
using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

public class CustomizationResult
{
    /// <summary>"sample" or "live".</summary>
    public string DataSource { get; set; } = "sample";
    public IList<ComponentDto> Items { get; set; } = new List<ComponentDto>();
}

/// <summary>Optional per-item override, deserialized from the CustomizationOverrides setting.</summary>
public class CustomizationOverride
{
    public int? Level { get; set; }
    public string Owner { get; set; }
    public string Note { get; set; }
    public string Group { get; set; }
    public bool? Hidden { get; set; }
}
```

- [ ] **Step 3: Create `MetricsResult.cs`**

```csharp
using System;
using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

public class MetricsResult
{
    public string DataSource { get; set; } = "sample";
    public string Metric { get; set; }
    public IList<MetricSeries> Series { get; set; } = new List<MetricSeries>();
}

public class MetricSeries
{
    public string RegionId { get; set; }
    public IList<MetricPoint> Points { get; set; } = new List<MetricPoint>();
}

public class MetricPoint
{
    public DateTime Ts { get; set; }
    public double Value { get; set; }
}
```

- [ ] **Step 4: Create `StatusResult.cs`**

```csharp
using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

public class StatusResult
{
    public string DataSource { get; set; } = "sample";
    public IList<ServiceStatusDto> Statuses { get; set; } = new List<ServiceStatusDto>();
}
```

- [ ] **Step 5: Create `MetricsQuery.cs`**

```csharp
using System;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

public class MetricsQuery
{
    public static readonly string[] KnownMetrics = ["requests", "users", "orders", "instances"];

    public string Metric { get; set; } = "requests";
    /// <summary>Window start (UTC). Defaults to To − 24h.</summary>
    public DateTime? From { get; set; }
    /// <summary>Window end (UTC). Defaults to now.</summary>
    public DateTime? To { get; set; }
    /// <summary>Point spacing in minutes, 5–120.</summary>
    public int Granularity { get; set; } = 30;
}
```

- [ ] **Step 6: Build to catch compile breaks** (the Stage-1 service still references removed properties — expected to FAIL)

Run: `dotnet build src/VirtoCommerce.SolutionArchitectureMap.Web/VirtoCommerce.SolutionArchitectureMap.Web.csproj`
Expected: FAIL in `SampleSolutionArchitectureMapService.cs` (references `Components`/`Statuses`). That's the strangler seam — fixed in Task 3. **Do not commit yet**; Tasks 1–3 commit together after the build is green again (Task 3 Step 7).

---

### Task 2: Provider interfaces (Core)

**Files:**
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Core/Services/ISolutionTopologyProvider.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Core/Services/ICustomizationProvider.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Core/Services/IMetricsProvider.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Core/Services/IServiceStatusProvider.cs`
- Delete: `src/VirtoCommerce.SolutionArchitectureMap.Core/Services/ISolutionArchitectureMapService.cs`

- [ ] **Step 1: Create the four interfaces** (one file each, same shape):

```csharp
// ISolutionTopologyProvider.cs
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>Supplies the (rarely changing) solution topology for GET /model.</summary>
public interface ISolutionTopologyProvider
{
    Task<SolutionMapModel> GetTopologyAsync();
}
```

```csharp
// ICustomizationProvider.cs
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>Supplies the standard-vs-custom inventory for GET /customization.</summary>
public interface ICustomizationProvider
{
    Task<CustomizationResult> GetCustomizationAsync();
}
```

```csharp
// IMetricsProvider.cs
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>Supplies per-region time series for GET /metrics.</summary>
public interface IMetricsProvider
{
    Task<MetricsResult> GetMetricsAsync(MetricsQuery query);
}
```

```csharp
// IServiceStatusProvider.cs
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>Supplies live service states for GET /status (polled).</summary>
public interface IServiceStatusProvider
{
    Task<StatusResult> GetStatusesAsync();
}
```

- [ ] **Step 2: Delete `ISolutionArchitectureMapService.cs`**

```bash
git rm src/VirtoCommerce.SolutionArchitectureMap.Core/Services/ISolutionArchitectureMapService.cs
```

---

### Task 3: Sample providers (Web) — port Stage-1 mock data 1:1

**Files:**
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Web/Services/SampleData.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Web/Services/SampleTopologyProvider.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Web/Services/SampleMetricsProvider.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Web/Services/SampleStatusProvider.cs`
- Delete: `src/VirtoCommerce.SolutionArchitectureMap.Web/Services/SampleSolutionArchitectureMapService.cs`
- Test: `tests/VirtoCommerce.SolutionArchitectureMap.Tests/SampleMetricsProviderTests.cs`

- [ ] **Step 1: Create `SampleData.cs`** — one static class holding all sample content. **Copy the data bodies verbatim from the existing `SampleSolutionArchitectureMapService.cs`** (regions/tenants/connections/metricMax from `GetModelAsync`, component list from `BuildComponents()`); they are the exact rows already verified in the running platform. Structure:

```csharp
using System.Collections.Generic;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Services;

/// <summary>Single home for all sample ("demo") data used by the Sample* providers.</summary>
public static class SampleData
{
    public static SolutionMapModel Topology() => new()
    {
        DataSource = "sample",
        Platform = new PlatformInfo { Name = "Virto Commerce", Version = "3.1039.0" },
        Tenants = /* copy the Tenants list literally from SampleSolutionArchitectureMapService.GetModelAsync */,
        Regions = /* copy the Regions list literally */,
        Connections = /* copy the Connections list literally */,
        MetricMax = new MetricMaxDto { Requests = 2400, Users = 12000, Orders = 280, Instances = 18 },
    };

    /// <summary>All 30 heat-map components (12 cloud + 18 commerce) — copy of BuildComponents().</summary>
    public static IList<ComponentDto> Components() => /* copy BuildComponents() body literally */;

    /// <summary>Only the infrastructure ("cloud") rows — used by ManifestCustomizationProvider (Task 4).</summary>
    public static IList<ComponentDto> InfrastructureComponents()
    {
        var result = new List<ComponentDto>();
        foreach (var c in Components())
        {
            if (c.Group == "cloud") result.Add(c);
        }
        return result;
    }

    public static IList<ServiceStatusDto> Statuses() =>
    [
        new() { ComponentId = "h_syncer", State = "healthy", LatencyMs = 34 },
        new() { ComponentId = "h_sql", State = "healthy", LatencyMs = 12 },
    ];
}
```

- [ ] **Step 2: Create `SampleTopologyProvider.cs`**

```csharp
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Services;

public class SampleTopologyProvider : ISolutionTopologyProvider
{
    public Task<SolutionMapModel> GetTopologyAsync() => Task.FromResult(SampleData.Topology());
}
```

- [ ] **Step 3: Create `SampleStatusProvider.cs`**

```csharp
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Services;

public class SampleStatusProvider : IServiceStatusProvider
{
    public Task<StatusResult> GetStatusesAsync() =>
        Task.FromResult(new StatusResult { DataSource = "sample", Statuses = SampleData.Statuses() });
}
```

- [ ] **Step 4: Write the failing metrics test** — `tests/.../SampleMetricsProviderTests.cs`

```csharp
using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Web.Services;
using Xunit;

namespace VirtoCommerce.SolutionArchitectureMap.Tests;

public class SampleMetricsProviderTests
{
    private static MetricsQuery Query(string metric = "requests") => new()
    {
        Metric = metric,
        From = new DateTime(2026, 07, 16, 0, 0, 0, DateTimeKind.Utc),
        To = new DateTime(2026, 07, 17, 0, 0, 0, DateTimeKind.Utc),
        Granularity = 30,
    };

    [Fact]
    public async Task GetMetrics_Returns_Series_For_All_Regions_With_Expected_Point_Count()
    {
        // Arrange
        var provider = new SampleMetricsProvider();
        // Act
        var result = await provider.GetMetricsAsync(Query());
        // Assert — 5 sample regions; 24h / 30min inclusive => 49 points
        result.DataSource.Should().Be("sample");
        result.Series.Should().HaveCount(5);
        result.Series.All(s => s.Points.Count == 49).Should().BeTrue();
    }

    [Fact]
    public async Task GetMetrics_Requests_Follow_The_Sun()
    {
        // Arrange
        var provider = new SampleMetricsProvider();
        var result = await provider.GetMetricsAsync(Query());
        double At(string region, int hourUtc) => result.Series.Single(s => s.RegionId == region)
            .Points.Single(p => p.Ts.Hour == hourUtc && p.Ts.Minute == 0).Value;
        // Assert — Asia peaks at 03:00 UTC; US peaks at 18:00 UTC (prototype-verified behavior)
        At("japan", 3).Should().BeGreaterThan(At("japan", 18));
        At("eastus2", 18).Should().BeGreaterThan(At("eastus2", 3));
        // Weight applied: master region ceiling above japan's at their own peaks
        At("eastus2", 18).Should().BeGreaterThan(At("japan", 3));
    }

    [Fact]
    public async Task GetMetrics_Instances_Have_Floor_Of_Three()
    {
        var provider = new SampleMetricsProvider();
        var result = await provider.GetMetricsAsync(Query("instances"));
        result.Series.SelectMany(s => s.Points).Min(p => p.Value).Should().BeGreaterThanOrEqualTo(3);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `dotnet test tests/VirtoCommerce.SolutionArchitectureMap.Tests/VirtoCommerce.SolutionArchitectureMap.Tests.csproj --filter SampleMetricsProviderTests`
Expected: FAIL — `SampleMetricsProvider` does not exist.

- [ ] **Step 6: Create `SampleMetricsProvider.cs`** — the prototype's diurnal generator, server-side:

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Services;

/// <summary>
/// Generates timezone-aware diurnal curves per region (business-hours peak ~13:00 local,
/// evening bump ~20:00) — the same formula the prototype animated client-side.
/// Replace with real telemetry later; the contract stays identical.
/// </summary>
public class SampleMetricsProvider : IMetricsProvider
{
    public Task<MetricsResult> GetMetricsAsync(MetricsQuery query)
    {
        var topology = SampleData.Topology();
        var to = query.To ?? DateTime.UtcNow;
        var from = query.From ?? to.AddHours(-24);
        var step = TimeSpan.FromMinutes(query.Granularity);

        var result = new MetricsResult { DataSource = "sample", Metric = query.Metric };
        foreach (var region in topology.Regions)
        {
            var series = new MetricSeries { RegionId = region.Id, Points = new List<MetricPoint>() };
            for (var ts = from; ts <= to; ts = ts.Add(step))
            {
                series.Points.Add(new MetricPoint { Ts = ts, Value = ValueAt(query.Metric, region, topology.MetricMax, ts) });
            }
            result.Series.Add(series);
        }
        return Task.FromResult(result);
    }

    internal static double ValueAt(string metric, RegionDto region, MetricMaxDto max, DateTime tsUtc)
    {
        var localHour = ((tsUtc.TimeOfDay.TotalHours + region.TzOffset) % 24 + 24) % 24;
        var f = Diurnal(localHour);
        return metric switch
        {
            "instances" => Math.Max(3, Math.Round(3 + (max.Instances - 3) * f * region.Weight)),
            "users" => Math.Round(max.Users * region.Weight * f),
            "orders" => Math.Round(max.Orders * region.Weight * f),
            _ => Math.Round(max.Requests * region.Weight * f),
        };
    }

    /// <summary>Normalized load curve 0.04..1 over local hour-of-day (prototype formula).</summary>
    internal static double Diurnal(double h)
    {
        double G(double mu, double s)
        {
            var d = Math.Abs(h - mu);
            d = Math.Min(d, 24 - d);
            return Math.Exp(-(d * d) / (2 * s * s));
        }
        var f = 0.14 + 0.86 * (0.74 * G(13, 3.4) + 0.46 * G(20, 2.1));
        return Math.Clamp(f * 1.16, 0.04, 1.0);
    }
}
```

- [ ] **Step 7: Delete the Stage-1 service, run tests + build**

```bash
git rm src/VirtoCommerce.SolutionArchitectureMap.Web/Services/SampleSolutionArchitectureMapService.cs
```

⚠️ The controller still references the deleted service — **temporarily** comment nothing; instead proceed to build; if the controller breaks the build, stub it by replacing its constructor/action with the topology provider (full controller rewrite comes in Task 5). Minimal interim controller body:

```csharp
// SolutionArchitectureMapController.cs — interim body so Tasks 1-3 commit green (rewritten fully in Task 5)
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.SolutionArchitectureMap.Core;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Controllers.Api;

[ApiController]
[Route("api/solution-architecture-map")]
[Authorize(ModuleConstants.Security.Permissions.Access)]
public class SolutionArchitectureMapController(ISolutionTopologyProvider topology) : ControllerBase
{
    [HttpGet("model")]
    [ProducesResponseType(typeof(SolutionMapModel), 200)]
    public async Task<ActionResult<SolutionMapModel>> GetModel() => Ok(await topology.GetTopologyAsync());
}
```

Also update `Module.cs` DI (replace the Stage-1 registration):

```csharp
// in Initialize(), replace the ISolutionArchitectureMapService line with:
serviceCollection.AddSingleton<Core.Services.ISolutionTopologyProvider, Services.SampleTopologyProvider>();
serviceCollection.AddSingleton<Core.Services.IMetricsProvider, Services.SampleMetricsProvider>();
serviceCollection.AddSingleton<Core.Services.IServiceStatusProvider, Services.SampleStatusProvider>();
```

Run: `dotnet test tests/... --filter SampleMetricsProviderTests` → 3 PASS.
Run: `dotnet build src/...Web.csproj` → 0 warnings / 0 errors.

- [ ] **Step 8: Commit Tasks 1–3**

```bash
git add -A
git commit -m "feat: 4-endpoint contract models, provider interfaces, sample providers with server-side diurnal metrics"
```

---

### Task 4: Live provider — ManifestCustomizationProvider (+ setting)

**Files:**
- Modify: `src/VirtoCommerce.SolutionArchitectureMap.Core/ModuleConstants.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Web/Services/IInstalledModulesReader.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Web/Services/IOverridesReader.cs`
- Create: `src/VirtoCommerce.SolutionArchitectureMap.Web/Services/ManifestCustomizationProvider.cs`
- Test: `tests/VirtoCommerce.SolutionArchitectureMap.Tests/ManifestCustomizationProviderTests.cs`

- [ ] **Step 1: Add the overrides setting to `ModuleConstants.Settings.General`** (next to `SolutionArchitectureMapEnabled`; add it to `AllGeneralSettings` yield):

```csharp
public static SettingDescriptor CustomizationOverrides { get; } = new()
{
    Name = "SolutionArchitectureMap.CustomizationOverrides",
    GroupName = "Solution Architecture Map|General",
    ValueType = SettingValueType.Json,
    DefaultValue = "{}",
};
```

```csharp
// in AllGeneralSettings:
yield return SolutionArchitectureMapEnabled;
yield return CustomizationOverrides;
```

- [ ] **Step 2: Create the two seam interfaces** (small, so the provider is unit-testable without platform types):

```csharp
// IInstalledModulesReader.cs
using System.Collections.Generic;
using System.Linq;
using VirtoCommerce.Platform.Core.Modularity;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Services;

public record InstalledModule(string Id, string Title, string Version, IList<string> Authors);

public interface IInstalledModulesReader
{
    IList<InstalledModule> GetInstalledModules();
}

/// <summary>Reads the platform's local module catalog.</summary>
public class LocalInstalledModulesReader(ILocalModuleCatalog catalog) : IInstalledModulesReader
{
    public IList<InstalledModule> GetInstalledModules() =>
        catalog.Modules.OfType<ManifestModuleInfo>()
            .Where(m => m.IsInstalled)
            .Select(m => new InstalledModule(m.Id, m.Title ?? m.Id, m.Version?.ToString() ?? "", m.Authors?.ToList() ?? []))
            .ToList();
}
```

```csharp
// IOverridesReader.cs
using System.Threading.Tasks;
using VirtoCommerce.Platform.Core.Settings;
using VirtoCommerce.SolutionArchitectureMap.Core;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Services;

public interface IOverridesReader
{
    Task<string> GetOverridesJsonAsync();
}

/// <summary>Reads the CustomizationOverrides platform setting.</summary>
public class SettingsOverridesReader(ISettingsManager settingsManager) : IOverridesReader
{
    public async Task<string> GetOverridesJsonAsync() =>
        await settingsManager.GetValueAsync<string>(ModuleConstants.Settings.General.CustomizationOverrides) ?? "{}";
}
```

> If `GetValueAsync<T>(SettingDescriptor)` doesn't exist in platform 3.1039 (compile error), use
> `(await settingsManager.GetObjectSettingAsync(ModuleConstants.Settings.General.CustomizationOverrides.Name))?.Value?.ToString() ?? "{}"`.

- [ ] **Step 3: Write the failing tests** — `ManifestCustomizationProviderTests.cs`

```csharp
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using VirtoCommerce.SolutionArchitectureMap.Web.Services;
using Xunit;

namespace VirtoCommerce.SolutionArchitectureMap.Tests;

public class ManifestCustomizationProviderTests
{
    private class FakeModules(params InstalledModule[] modules) : IInstalledModulesReader
    {
        public IList<InstalledModule> GetInstalledModules() => modules;
    }
    private class FakeOverrides(string json) : IOverridesReader
    {
        public Task<string> GetOverridesJsonAsync() => Task.FromResult(json);
    }

    private static ManifestCustomizationProvider Create(string overridesJson = "{}", params InstalledModule[] modules) =>
        new(new FakeModules(modules), new FakeOverrides(overridesJson), NullLogger<ManifestCustomizationProvider>.Instance);

    private static readonly InstalledModule VirtoCatalog = new("VirtoCommerce.Catalog", "Catalog", "3.900.0", ["Virto Commerce"]);
    private static readonly InstalledModule PartnerErp = new("Acme.Erp", "ERP Integration", "1.0.0", ["Acme Corp"]);

    [Fact]
    public async Task Heuristic_VirtoAuthor_Is_Standard_Others_Custom()
    {
        var result = await Create("{}", VirtoCatalog, PartnerErp).GetCustomizationAsync();
        var catalog = result.Items.Single(i => i.Id == "VirtoCommerce.Catalog");
        var erp = result.Items.Single(i => i.Id == "Acme.Erp");
        catalog.Level.Should().Be(0);
        catalog.Owner.Should().Be("Virto");
        erp.Level.Should().Be(3);
        erp.Owner.Should().Be("Acme Corp");
        result.DataSource.Should().Be("live");
    }

    [Fact]
    public async Task Overrides_Change_Level_Owner_And_Hide()
    {
        var json = """
            { "VirtoCommerce.Catalog": { "level": 1, "note": "configured" },
              "Acme.Erp": { "owner": "Luminos Labs", "hidden": false },
              "h_syncer": { "hidden": true } }
            """;
        var result = await Create(json, VirtoCatalog, PartnerErp).GetCustomizationAsync();
        result.Items.Single(i => i.Id == "VirtoCommerce.Catalog").Level.Should().Be(1);
        result.Items.Single(i => i.Id == "Acme.Erp").Owner.Should().Be("Luminos Labs");
        result.Items.Should().NotContain(i => i.Id == "h_syncer"); // infra item hidden by override
    }

    [Fact]
    public async Task Includes_Sample_Infrastructure_Items()
    {
        var result = await Create("{}", VirtoCatalog).GetCustomizationAsync();
        result.Items.Should().Contain(i => i.Group == "cloud" && i.Id == "h_aks");
    }

    [Fact]
    public async Task Malformed_Overrides_Fall_Back_To_Heuristic()
    {
        var result = await Create("{not json!", VirtoCatalog).GetCustomizationAsync();
        result.Items.Single(i => i.Id == "VirtoCommerce.Catalog").Level.Should().Be(0);
    }
}
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `dotnet test tests/... --filter ManifestCustomizationProviderTests`
Expected: FAIL — `ManifestCustomizationProvider` does not exist.

- [ ] **Step 5: Implement `ManifestCustomizationProvider.cs`**

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Services;

/// <summary>
/// LIVE customization inventory: installed platform modules classified by author heuristic
/// (author "Virto Commerce" => standard, else custom), merged with JSON overrides from the
/// SolutionArchitectureMap.CustomizationOverrides setting. Infrastructure ("cloud") items
/// come from the sample inventory until the Virto Cloud infra API exists (spec §5.3).
/// </summary>
public class ManifestCustomizationProvider(
    IInstalledModulesReader modulesReader,
    IOverridesReader overridesReader,
    ILogger<ManifestCustomizationProvider> logger) : ICustomizationProvider
{
    private const string VirtoAuthor = "virto commerce";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private (DateTime At, CustomizationResult Result)? _cache;

    public async Task<CustomizationResult> GetCustomizationAsync()
    {
        var cached = _cache;
        if (cached.HasValue && DateTime.UtcNow - cached.Value.At < CacheTtl)
        {
            return cached.Value.Result;
        }

        var overrides = ParseOverrides(await overridesReader.GetOverridesJsonAsync(), logger);
        var items = new List<ComponentDto>();

        // 1. Infrastructure rows (sample until infra API exists)
        items.AddRange(SampleData.InfrastructureComponents());

        // 2. Installed modules via author heuristic
        var dataSource = "sample";
        try
        {
            foreach (var module in modulesReader.GetInstalledModules())
            {
                var isVirto = module.Authors.Any(a => string.Equals(a?.Trim(), "virto commerce", StringComparison.OrdinalIgnoreCase));
                items.Add(new ComponentDto
                {
                    Id = module.Id,
                    Name = module.Title,
                    Group = "commerce",
                    Level = isVirto ? 0 : 3,
                    Owner = isVirto ? "Virto" : (module.Authors.FirstOrDefault() ?? "Custom"),
                    Version = module.Version,
                });
            }
            dataSource = "live";
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to enumerate installed modules; customization stays sample-only");
        }

        // 3. Apply overrides (keys are item ids: module ids or h_* infra ids)
        var merged = new List<ComponentDto>();
        foreach (var item in items)
        {
            if (overrides.TryGetValue(item.Id, out var o))
            {
                if (o.Hidden == true) continue;
                if (o.Level.HasValue) item.Level = Math.Clamp(o.Level.Value, 0, 3);
                if (!string.IsNullOrEmpty(o.Owner)) item.Owner = o.Owner;
                if (!string.IsNullOrEmpty(o.Note)) item.Note = o.Note;
                if (!string.IsNullOrEmpty(o.Group)) item.Group = o.Group;
            }
            merged.Add(item);
        }

        var result = new CustomizationResult { DataSource = dataSource, Items = merged };
        _cache = (DateTime.UtcNow, result);
        return result;
    }

    internal static Dictionary<string, CustomizationOverride> ParseOverrides(string json, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, CustomizationOverride>>(json, JsonOptions) ?? [];
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "CustomizationOverrides setting is not valid JSON; ignoring overrides");
            return [];
        }
    }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `dotnet test tests/... --filter ManifestCustomizationProviderTests` → 4 PASS.

- [ ] **Step 7: Register in `Module.cs` `Initialize()`** (after the sample providers):

```csharp
serviceCollection.AddSingleton<Services.IInstalledModulesReader, Services.LocalInstalledModulesReader>();
serviceCollection.AddSingleton<Services.IOverridesReader, Services.SettingsOverridesReader>();
serviceCollection.AddSingleton<Core.Services.ICustomizationProvider, Services.ManifestCustomizationProvider>();
```

- [ ] **Step 8: Build + full test run + commit**

Run: `dotnet build src/...Web.csproj` → 0/0. Run: `dotnet test` → all pass.

```bash
git add -A
git commit -m "feat: live ManifestCustomizationProvider with author heuristic and CustomizationOverrides setting"
```

---

### Task 5: Controller — 4 actions with validation

**Files:**
- Rewrite: `src/VirtoCommerce.SolutionArchitectureMap.Web/Controllers/Api/SolutionArchitectureMapController.cs`
- Test: `tests/VirtoCommerce.SolutionArchitectureMap.Tests/SolutionArchitectureMapControllerTests.cs`

- [ ] **Step 1: Write the failing tests**

```csharp
using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Web.Controllers.Api;
using VirtoCommerce.SolutionArchitectureMap.Web.Services;
using Xunit;

namespace VirtoCommerce.SolutionArchitectureMap.Tests;

public class SolutionArchitectureMapControllerTests
{
    private static SolutionArchitectureMapController Create() => new(
        new SampleTopologyProvider(),
        new ManifestCustomizationProvider(
            new EmptyModules(), new EmptyOverrides(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ManifestCustomizationProvider>.Instance),
        new SampleMetricsProvider(),
        new SampleStatusProvider());

    private class EmptyModules : IInstalledModulesReader
    {
        public System.Collections.Generic.IList<InstalledModule> GetInstalledModules() => [];
    }
    private class EmptyOverrides : IOverridesReader
    {
        public Task<string> GetOverridesJsonAsync() => Task.FromResult("{}");
    }

    [Fact]
    public void Controller_Is_Permission_Gated()
    {
        var attr = typeof(SolutionArchitectureMapController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), true);
        attr.Should().NotBeEmpty();
        ((AuthorizeAttribute)attr[0]).Policy.Should().Be("solution-architecture-map:access");
    }

    [Fact]
    public async Task All_Four_Actions_Return_Contract_Shapes()
    {
        var c = Create();
        ((await c.GetModel()).Result as OkObjectResult)!.Value.Should().BeOfType<SolutionMapModel>();
        ((await c.GetCustomization()).Result as OkObjectResult)!.Value.Should().BeOfType<CustomizationResult>();
        ((await c.GetMetrics("requests", null, null, 30)).Result as OkObjectResult)!.Value.Should().BeOfType<MetricsResult>();
        ((await c.GetStatus()).Result as OkObjectResult)!.Value.Should().BeOfType<StatusResult>();
    }

    [Theory]
    [InlineData("bogus", 30)]   // unknown metric
    [InlineData("requests", 2)] // granularity below 5
    [InlineData("requests", 500)] // granularity above 120
    public async Task GetMetrics_Invalid_Query_Returns_400(string metric, int granularity)
    {
        var c = Create();
        var result = await c.GetMetrics(metric, null, null, granularity);
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetMetrics_To_Before_From_Returns_400()
    {
        var c = Create();
        var result = await c.GetMetrics("requests",
            new DateTime(2026, 07, 17), new DateTime(2026, 07, 16), 30);
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/... --filter SolutionArchitectureMapControllerTests`
Expected: FAIL — controller lacks the new constructor/actions.

- [ ] **Step 3: Rewrite the controller**

```csharp
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.SolutionArchitectureMap.Core;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Controllers.Api;

[ApiController]
[Route("api/solution-architecture-map")]
[Authorize(ModuleConstants.Security.Permissions.Access)]
public class SolutionArchitectureMapController(
    ISolutionTopologyProvider topologyProvider,
    ICustomizationProvider customizationProvider,
    IMetricsProvider metricsProvider,
    IServiceStatusProvider statusProvider) : ControllerBase
{
    /// <summary>Solution topology: platform, tenants, regions, connections, metric ceilings.</summary>
    [HttpGet("model")]
    [ProducesResponseType(typeof(SolutionMapModel), 200)]
    public async Task<ActionResult<SolutionMapModel>> GetModel() =>
        Ok(await topologyProvider.GetTopologyAsync());

    /// <summary>Standard-vs-custom inventory for the customization heat map.</summary>
    [HttpGet("customization")]
    [ProducesResponseType(typeof(CustomizationResult), 200)]
    public async Task<ActionResult<CustomizationResult>> GetCustomization() =>
        Ok(await customizationProvider.GetCustomizationAsync());

    /// <summary>Per-region time series. Defaults: last 24h, 30-minute granularity.</summary>
    [HttpGet("metrics")]
    [ProducesResponseType(typeof(MetricsResult), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<MetricsResult>> GetMetrics(
        [FromQuery] string metric = "requests",
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int granularity = 30)
    {
        if (!MetricsQuery.KnownMetrics.Contains(metric))
        {
            return BadRequest($"Unknown metric '{metric}'. Known: {string.Join(", ", MetricsQuery.KnownMetrics)}.");
        }
        if (granularity is < 5 or > 120)
        {
            return BadRequest("granularity must be between 5 and 120 minutes.");
        }
        if (from.HasValue && to.HasValue && to <= from)
        {
            return BadRequest("'to' must be after 'from'.");
        }
        var query = new MetricsQuery { Metric = metric, From = from, To = to, Granularity = granularity };
        return Ok(await metricsProvider.GetMetricsAsync(query));
    }

    /// <summary>Live service statuses (poll ~15s).</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(StatusResult), 200)]
    public async Task<ActionResult<StatusResult>> GetStatus() =>
        Ok(await statusProvider.GetStatusesAsync());
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test` → all pass (metrics + customization + controller suites).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 4-endpoint REST controller with metrics query validation"
```

---

### Task 6: Verify the API against the running platform

No code — a verification gate. Requires the user's platform running with the module (symlinked as `modules/_A`).

- [ ] **Step 1: Ask the user to restart the platform** (C# changed).
- [ ] **Step 2: Token + all four endpoints**

```bash
TOK=$(curl -sk -X POST "https://localhost:5001/connect/token" -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=<ask user>" | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
for EP in model customization "metrics?metric=requests" status; do
  echo "== $EP =="; curl -sk -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOK" "https://localhost:5001/api/solution-architecture-map/$EP"
done
```

Expected: four `200`s. Also `curl -sk .../model` **without** token → `401`.
- [ ] **Step 3: Spot-check `/customization`** — items must include real installed module ids (e.g. `VirtoCommerce.Catalog`) with `level: 0` and `dataSource: "live"`, plus `h_*` infra rows.
- [ ] **Step 4: Cookie-auth risk gate (spec §7)** — in a browser logged into the back office, run from DevTools console on the platform origin: `await (await fetch('/api/solution-architecture-map/status', {credentials:'same-origin'})).status` → expected `200`. If it's `401`, STOP and surface to the user: the spec's D3 fallback (postMessage token) must be activated as a design change.

---

## Phase B — Frontend contract layer (Task 7)

### Task 7: TS types/client/mock + parametrized engine binding

The engine becomes the strangler **reference implementation**: it now renders from fetched data. Visuals must not change.

**Files:**
- Rewrite: `client-app/src/api/types.ts`
- Rewrite: `client-app/src/api/client.ts`
- Rewrite: `client-app/src/api/mock.ts`
- Create: `client-app/src/data/infrastructureInventory.ts` (only if mock needs sharing — see Step 3 note)
- Modify: `client-app/src/engine/solutionMap.js`
- Modify: `client-app/src/components/SolutionMap.vue`

- [ ] **Step 1: Rewrite `types.ts`** — align with the 4 endpoints:

```typescript
// ============================================================================
// API contract — exact camelCase mirror of Core/Models (see spec §4).
// ============================================================================
export type MetricKey = "requests" | "users" | "orders" | "instances";
export type DataSource = "sample" | "live";
export type RegionRole = "master-write" | "read-replica" | "read-cache" | "local-rw";

export interface TenantDto { id: string; name: string; cloud: string; description: string; }

export interface RegionDto {
  id: string; name: string; city: string;
  lat: number; lon: number; tenantId: string; role: RegionRole;
  master?: boolean; tzOffset: number; weight: number;
}

export interface ConnectionDto { from: string; to: string; type: "replication" | "mutation" | "syncer"; }

export interface ComponentDto {
  id: string; name: string; group: "cloud" | "commerce";
  level: 0 | 1 | 2 | 3;
  owner?: string; azureService?: string; version?: string; note?: string;
}

export interface ServiceStatusDto {
  componentId: string; state: "healthy" | "degraded" | "down"; latencyMs?: number | null;
}

export interface SolutionMapModel {
  dataSource: DataSource;
  platform: { name: string; version: string };
  tenants: TenantDto[];
  regions: RegionDto[];
  connections: ConnectionDto[];
  metricMax: Record<MetricKey, number>;
}

export interface CustomizationResult { dataSource: DataSource; items: ComponentDto[]; }

export interface MetricPoint { ts: string; value: number; }
export interface MetricSeries { regionId: string; points: MetricPoint[]; }
export interface MetricsResult { dataSource: DataSource; metric: MetricKey; series: MetricSeries[]; }

export interface StatusResult { dataSource: DataSource; statuses: ServiceStatusDto[]; }

/** Everything the UI needs, fetched together at startup (statuses re-polled separately). */
export interface SolutionData {
  model: SolutionMapModel;
  customization: CustomizationResult;
  /** true when any piece fell back to bundled sample data */
  usedFallback: boolean;
}
```

- [ ] **Step 2: Rewrite `client.ts`** — 4 typed calls, cookie auth, per-call mock switch:

```typescript
import type { CustomizationResult, MetricKey, MetricsResult, SolutionMapModel, StatusResult } from "./types";
import { mockCustomization, mockMetrics, mockModel, mockStatus } from "./mock";

// Dev (`vite dev`) or VITE_USE_MOCK=true → in-repo mock so the app runs standalone.
// Production → module BFF with the platform's same-origin auth cookie (spec §7).
const USE_MOCK = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === "true";
const API_BASE = import.meta.env.VITE_API_BASE || "/api/solution-architecture-map";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export function getModel(): Promise<SolutionMapModel> {
  return USE_MOCK ? Promise.resolve(structuredClone(mockModel)) : get("/model");
}
export function getCustomization(): Promise<CustomizationResult> {
  return USE_MOCK ? Promise.resolve(structuredClone(mockCustomization)) : get("/customization");
}
export function getMetrics(metric: MetricKey): Promise<MetricsResult> {
  return USE_MOCK ? Promise.resolve(mockMetrics(metric)) : get(`/metrics?metric=${metric}`);
}
export function getStatus(): Promise<StatusResult> {
  return USE_MOCK ? Promise.resolve(structuredClone(mockStatus)) : get("/status");
}
```

- [ ] **Step 3: Rewrite `mock.ts`** — reshape the existing mock (KEEP the current region/tenant/connection/component rows byte-identical; they're already the verified sample set). Export shape changes:

```typescript
import type { ComponentDto, CustomizationResult, MetricKey, MetricsResult, SolutionMapModel, StatusResult } from "./types";

export const mockModel: SolutionMapModel = { /* current mock minus components/statuses */ };

const mockComponents: ComponentDto[] = [ /* current components array, unchanged */ ];

export const mockCustomization: CustomizationResult = { dataSource: "sample", items: mockComponents };

export const mockStatus: StatusResult = {
  dataSource: "sample",
  statuses: [
    { componentId: "h_syncer", state: "healthy", latencyMs: 34 },
    { componentId: "h_sql", state: "healthy", latencyMs: 12 },
  ],
};

/** Same diurnal generator as SampleMetricsProvider (server is source of truth; this mirrors it for dev). */
export function mockMetrics(metric: MetricKey): MetricsResult {
  const g = (h: number, mu: number, s: number) => { let d = Math.abs(h - mu); d = Math.min(d, 24 - d); return Math.exp(-(d * d) / (2 * s * s)); };
  const diurnal = (h: number) => Math.max(0.04, Math.min(1, 1.16 * (0.14 + 0.86 * (0.74 * g(h, 13, 3.4) + 0.46 * g(h, 20, 2.1)))));
  const max = mockModel.metricMax[metric];
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
  return {
    dataSource: "sample", metric,
    series: mockModel.regions.map((r) => ({
      regionId: r.id,
      points: Array.from({ length: 49 }, (_, i) => {
        const ts = new Date(dayStart.getTime() + i * 30 * 60_000);
        const localH = (((ts.getTime() / 3_600_000) % 24) + r.tzOffset + 24) % 24;
        const f = diurnal(localH);
        const value = metric === "instances" ? Math.max(3, Math.round(3 + (max - 3) * f * r.weight)) : Math.round(max * r.weight * f);
        return { ts: ts.toISOString(), value };
      }),
    })),
  };
}
```

- [ ] **Step 4: Parametrize the engine.** In `engine/solutionMap.js`, change the signature to `export function initSolutionMap(data)` where `data: SolutionData & { statuses: StatusResult }`. Inside, replace the hardcoded constants with derivations (insert at the very top of the function body, and DELETE the corresponding `const` declarations further down):

```javascript
export function initSolutionMap(data){
  const __model = data.model, __custom = data.customization, __statuses = data.statuses;

  // --- derived: replaces the hardcoded REGION_GEO const ---
  const REGION_GEO = Object.fromEntries(__model.regions.map(r => [r.id, {
    lon: r.lon, lat: r.lat, name: r.name, sub: r.city,
    master: !!r.master, tenant: r.tenantId,
  }]));
  // --- derived: replaces TZ / REGION_W / METRIC_MAX consts ---
  const TZ = Object.fromEntries(__model.regions.map(r => [r.id, r.tzOffset]));
  const REGION_W = Object.fromEntries(__model.regions.map(r => [r.id, r.weight]));
  const METRIC_MAX = __model.metricMax;
  // --- derived: replaces the FLOWS const (type names map to engine's short codes) ---
  const FLOW_TYPE = { replication: 'rep', mutation: 'mut', syncer: 'sync' };
  const FLOWS = __model.connections.map(c => [c.from, c.to, FLOW_TYPE[c.type]]);
  // --- derived: replaces the HEATMAP const (group items by cloud/commerce) ---
  const HEATMAP = {
    cloud:    { title: 'Virto Cloud · Infrastructure',        items: __custom.items.filter(i => i.group === 'cloud') },
    commerce: { title: 'Virto Commerce · Platform & Modules', items: __custom.items.filter(i => i.group === 'commerce') },
  };
  // --- derived: seeds LIVE status map (replaces the hardcoded demo object in refreshStatus) ---
  const LIVE_SEED = Object.fromEntries(__statuses.statuses.map(s => [s.componentId, { state: s.state, latencyMs: s.latencyMs ?? null }]));
  // ... existing engine body continues, with the duplicated consts REMOVED ...
```

Concrete edits inside the existing body:
1. Delete the old `const REGION_GEO = {...}`, `const TZ`, `const REGION_W`, `const METRIC_MAX`, `const FLOWS`, `const HEATMAP` blocks.
2. In `refreshStatus()`, replace the hardcoded `demo` object with `const demo = LIVE_SEED;` (keep the merge/apply logic).
3. `HT_INDEX`/heat-tile rendering already iterate `HEATMAP[g].items` — the ComponentDto field names (`id`, `name`, `level`, `owner`, `note`) match; no changes needed there.
4. The engine's internal `REGIONS` L3-internals config and `VER` stay bundled (presentational; spec §11).

- [ ] **Step 5: Update `SolutionMap.vue`** to fetch all data and pass it in:

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import markup from "../engine/markup.html?raw";
import { initSolutionMap } from "../engine/solutionMap.js";
import { getCustomization, getModel, getStatus } from "../api/client";
import { mockCustomization, mockModel, mockStatus } from "../api/mock";

const root = ref<HTMLElement | null>(null);

onMounted(async () => {
  if (!root.value) return;
  root.value.innerHTML = markup;

  let usedFallback = false;
  const [model, customization, statuses] = await Promise.all([
    getModel().catch(() => { usedFallback = true; return structuredClone(mockModel); }),
    getCustomization().catch(() => { usedFallback = true; return structuredClone(mockCustomization); }),
    getStatus().catch(() => { usedFallback = true; return structuredClone(mockStatus); }),
  ]);
  if (usedFallback) console.warn("[solution-map] one or more endpoints unavailable; using bundled sample data");

  initSolutionMap({ model, customization, statuses, usedFallback });
});
</script>
```

(Template/style unchanged.)

- [ ] **Step 6: Build + parity probe**

Run: `cd client-app && npm run build` → 0 TS errors.
Parity probe (driver runs in browser on `/apps/solution-architecture-map/` after platform login, or `npm run dev` standalone): world map with 5 regions; KPIs animate; heat map opens with the 77/23 ratio; **change a region name in the C# `SampleData` and restart platform → new name appears on the map** (proves API is the source).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: bind engine to 4-endpoint API (cookie auth, graceful sample fallback)"
```

---

## Phase C — Componentization (Tasks 8–13)

Shared rules for all scene ports:
- Templates are **copied from `client-app/src/engine/markup.html`** — each scene is one `<section class="scene" data-scene="…">…</section>` block; the chrome (topbar/breadcrumb/legend/info panel) is everything outside the `<main class="stage">`.
- `map.css` remains the single global stylesheet during the port (class names unchanged) — no per-component styles are introduced until after Task 13.
- After each task: `npm run build` (0 TS errors) + the scene's parity checks + commit. The engine file keeps working for scenes not yet ported: **`AppShell` mounts ported scenes; the engine path is only removed in Task 13.** During Tasks 8–12, `App.vue` renders `AppShell.vue`, and `AppShell` renders ported scene components; not-yet-ported scenes render the same markup via a temporary `LegacyScene.vue` that injects the relevant markup section and re-binds the engine's per-scene logic — **to keep this tractable, port scenes in the exact order below and keep `initSolutionMap` callable until Task 13.**

> Pragmatic note (allowed by spec §6.3): if wiring `LegacyScene` hybrid proves brittle in practice,
> the fallback is a feature branch where all five scenes are ported before `AppShell` replaces the
> engine in `App.vue` in one switch — parity gates then run per-scene on the branch. Either path
> must end Task 13 with the engine deleted and full parity green.

### Task 8: Composables (state layer, no UI change)

**Files:**
- Create: `client-app/src/composables/useSolutionData.ts`
- Create: `client-app/src/composables/useStatus.ts`
- Create: `client-app/src/composables/useTimeEngine.ts`
- Create: `client-app/src/composables/useSceneNav.ts`

- [ ] **Step 1: `useSolutionData.ts`**

```typescript
import { reactive, readonly } from "vue";
import { getCustomization, getModel } from "../api/client";
import { mockCustomization, mockModel } from "../api/mock";
import type { CustomizationResult, SolutionMapModel } from "../api/types";

interface State {
  loaded: boolean;
  usedFallback: boolean;
  model: SolutionMapModel;
  customization: CustomizationResult;
}

const state = reactive<State>({
  loaded: false,
  usedFallback: false,
  model: structuredClone(mockModel),
  customization: structuredClone(mockCustomization),
});

let loadPromise: Promise<void> | null = null;

export function useSolutionData() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const [model, customization] = await Promise.all([
        getModel().catch(() => { state.usedFallback = true; return structuredClone(mockModel); }),
        getCustomization().catch(() => { state.usedFallback = true; return structuredClone(mockCustomization); }),
      ]);
      state.model = model;
      state.customization = customization;
      state.loaded = true;
    })();
  }
  return readonly(state);
}
```

- [ ] **Step 2: `useStatus.ts`**

```typescript
import { computed, reactive, readonly } from "vue";
import { getStatus } from "../api/client";
import type { ServiceStatusDto } from "../api/types";

const POLL_MS = 15_000;

const state = reactive({
  byComponent: {} as Record<string, ServiceStatusDto>,
  stale: false,          // last poll failed → showing last-known
  started: false,
});

async function poll() {
  try {
    const res = await getStatus();
    for (const s of res.statuses) state.byComponent[s.componentId] = s;
    state.stale = false;
  } catch {
    state.stale = true;  // keep last-known (spec §10)
  }
}

export function useStatus() {
  if (!state.started) {
    state.started = true;
    void poll();
    setInterval(poll, POLL_MS);
  }
  const overall = computed<"healthy" | "degraded" | "down">(() => {
    const states = Object.values(state.byComponent).map((s) => s.state);
    if (states.includes("down")) return "down";
    if (states.includes("degraded")) return "degraded";
    return "healthy";
  });
  const stateOf = (componentId: string) => state.byComponent[componentId]?.state ?? "healthy";
  return { status: readonly(state), overall, stateOf };
}
```

- [ ] **Step 3: `useTimeEngine.ts`** — simulated 24h clock + interpolation over `/metrics`:

```typescript
import { computed, reactive, readonly } from "vue";
import { getMetrics } from "../api/client";
import { mockMetrics } from "../api/mock";
import type { MetricKey, MetricsResult } from "../api/types";

const state = reactive({
  minute: 600,            // simulated minute-of-day 0..1439 (starts 10:00 like the prototype)
  playing: true,
  speed: 180,             // simulated minutes per real second
  metric: "requests" as MetricKey,
  series: {} as Partial<Record<MetricKey, MetricsResult>>,
  usedFallback: false,
});

let rafId: number | null = null;
let lastTs: number | null = null;

function tick(ts: number) {
  if (lastTs == null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;
  state.minute = (state.minute + state.speed * dt) % 1440;
  rafId = state.playing ? requestAnimationFrame(tick) : null;
}

async function ensureSeries(metric: MetricKey) {
  if (state.series[metric]) return;
  state.series[metric] = await getMetrics(metric).catch(() => {
    state.usedFallback = true;
    return mockMetrics(metric);
  });
}

export function useTimeEngine() {
  void ensureSeries(state.metric);

  function setPlaying(p: boolean) {
    state.playing = p;
    if (p && rafId == null) { lastTs = null; rafId = requestAnimationFrame(tick); }
    if (!p && rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
  }
  if (state.playing && rafId == null) setPlaying(true);

  function setMetric(m: MetricKey) { state.metric = m; void ensureSeries(m); }
  function setSpeed(s: number) { state.speed = s; }
  function scrub(minute: number) { state.minute = minute; setPlaying(false); }

  /** Linear interpolation over the fetched series at the simulated minute-of-day. */
  function valueAt(regionId: string, metric: MetricKey = state.metric, minute = state.minute): number {
    const s = state.series[metric]?.series.find((x) => x.regionId === regionId);
    if (!s || s.points.length === 0) return 0;
    const n = s.points.length;                       // covers 24h inclusive
    const pos = (minute / 1440) * (n - 1);
    const i = Math.min(Math.floor(pos), n - 2);
    const frac = pos - i;
    return s.points[i].value * (1 - frac) + s.points[i + 1].value * frac;
  }

  /** Sum across regions (KPIs). */
  function globalAt(metric: MetricKey = state.metric, minute = state.minute): number {
    const res = state.series[metric];
    if (!res) return 0;
    return res.series.reduce((sum, s) => sum + valueAt(s.regionId, metric, minute), 0);
  }

  /** Cumulative day total for 'orders' KPI (integrates the rate series). */
  const ordersToday = computed(() => {
    let acc = 0;
    for (let m = 0; m <= state.minute; m += 5) acc += globalAt("orders", m) * 5;
    return acc;
  });

  const clock = computed(() => {
    const h = String(Math.floor(state.minute / 60)).padStart(2, "0");
    const m = String(Math.floor(state.minute % 60)).padStart(2, "0");
    return `${h}:${m}`;
  });

  return { time: readonly(state), clock, ordersToday, setPlaying, setMetric, setSpeed, scrub, valueAt, globalAt };
}
```

- [ ] **Step 4: `useSceneNav.ts`**

```typescript
import { computed, reactive, readonly } from "vue";

export type SceneId = "world" | "tenants" | "region" | "platform" | "heatmap";
export interface SceneEntry { scene: SceneId; arg?: string; }

const state = reactive({ path: [{ scene: "world" } as SceneEntry] });

export function useSceneNav() {
  const current = computed(() => state.path[state.path.length - 1]);
  function go(scene: SceneId, arg?: string) { state.path.push({ scene, arg }); }
  function back() { if (state.path.length > 1) state.path.pop(); }
  function jumpTo(index: number) { state.path = state.path.slice(0, index + 1); }
  function reset(scene: SceneId = "world") { state.path = [{ scene }]; }
  return { nav: readonly(state), current, go, back, jumpTo, reset };
}
```

- [ ] **Step 5: Build + commit** (no UI change yet — composables compile standalone)

Run: `cd client-app && npm run build` → 0 errors.

```bash
git add -A && git commit -m "feat: state composables (data, status poll, time engine, scene nav)"
```

---

### Task 9: AppShell + WorldScene (the big port)

**Files:**
- Create: `client-app/src/components/AppShell.vue`
- Create: `client-app/src/components/shared/StatusDot.vue`, `SampleDataBadge.vue`, `InfoPanel.vue`
- Create: `client-app/src/components/scenes/WorldScene.vue`
- Create: `client-app/src/components/world/WorldMap.vue`, `DaylightBand.vue`, `ConnectionsCard.vue`, `MetricDashboard.vue`
- Create: `client-app/src/components/scenes/LegacyScene.vue` (temporary bridge)
- Modify: `client-app/src/App.vue` (render `AppShell` instead of `SolutionMap`)

Port sources (all in-repo): chrome markup = everything in `markup.html` outside `<main class="stage">`; world scene markup = the `<section class="scene" data-scene="world">` block; behavior = the engine functions `buildWorld`, `updateTime`, `buildDayChart`, `setMetric`, `setSpeed`, `setActiveFlow`, `renderCrumbs`, `setInfoOverview` (world branch). The engine's `projX/projY` and the land-path `<path class="land" d="…"/>` (57,955 chars — keep in `WorldMap.vue`'s template via a small `landPath.ts` export to keep the SFC readable).

Implementation rules:
- All DOM updates that the engine did imperatively become Vue bindings driven by `useTimeEngine`/`useStatus`/`useSolutionData` (e.g. bubble radius `:r`, segment `:fill`, gradient `:gradientTransform`, KPI text).
- IDs/classes stay identical to the prototype so `map.css` and the parity probes keep working.
- `InfoPanel.vue` receives `{ kind, payload }` via a small provide/inject bus from scenes.

- [ ] **Step 1: Create shared components** (complete code):

```vue
<!-- shared/StatusDot.vue -->
<template><span class="status-dot" :class="state" /></template>
<script setup lang="ts">
defineProps<{ state: "healthy" | "degraded" | "down" }>();
</script>
```

```vue
<!-- shared/SampleDataBadge.vue -->
<template>
  <span v-if="show" class="demo" title="One or more data sources are returning sample data">
    ● sample data
  </span>
</template>
<script setup lang="ts">
defineProps<{ show: boolean }>();
</script>
```

`InfoPanel.vue`: copy the `<aside class="info">…</aside>` block from `markup.html` as template; props `{ kic: string; title: string; subtitle: string; bodyHtml: string }`; render `bodyHtml` with `v-html` (content is app-authored, not user input).

- [ ] **Step 2: Create `LegacyScene.vue`** (bridge for not-yet-ported scenes):

```vue
<template><div ref="host" class="sam-host"></div></template>
<script setup lang="ts">
// Temporary strangler bridge: renders the ORIGINAL engine app for scenes not yet ported.
// Deleted in Task 13.
import { onMounted, ref } from "vue";
import markup from "../../engine/markup.html?raw";
import { initSolutionMap } from "../../engine/solutionMap.js";
import { useSolutionData } from "../../composables/useSolutionData";
import { mockStatus } from "../../api/mock";
import { getStatus } from "../../api/client";

const props = defineProps<{ scene: string; arg?: string }>();
const host = ref<HTMLElement | null>(null);

onMounted(async () => {
  if (!host.value) return;
  host.value.innerHTML = markup;
  const data = useSolutionData();
  const statuses = await getStatus().catch(() => structuredClone(mockStatus));
  initSolutionMap({ model: data.model, customization: data.customization, statuses, usedFallback: data.usedFallback });
  // Jump the engine to the requested scene (engine exposes go/showScene globally via window.__SAM_NAV__ —
  // add that export in engine: `window.__SAM_NAV__ = { go, showScene };` at the end of initSolutionMap)
  const nav = (window as any).__SAM_NAV__;
  if (nav && props.scene !== "world") nav.showScene(props.scene, props.arg);
});
</script>
```

(Requires a 2-line engine addition: at the end of `initSolutionMap`, `window.__SAM_NAV__ = { go, showScene };`.)

- [ ] **Step 3: Create `AppShell.vue`** — chrome + scene router:

```vue
<template>
  <header class="topbar"><!-- copy topbar inner markup from markup.html; bind:
       health pill → overall/status from useStatus; title/badge static --></header>
  <nav class="breadcrumb">
    <div style="display:flex;align-items:center;gap:2px">
      <template v-for="(entry, i) in nav.path" :key="i">
        <span v-if="i > 0" class="crumb-arrow">›</span>
        <button class="crumb" :class="{ current: i === nav.path.length - 1 }"
                @click="i < nav.path.length - 1 && jumpTo(i)">{{ label(entry) }}</button>
      </template>
    </div>
    <div class="bc-spacer" />
    <SampleDataBadge :show="data.usedFallback || time.usedFallback" />
    <button class="view-btn" :class="{ on: current.scene === 'heatmap' }" @click="toggleHeatmap">▦ Customization map</button>
    <button class="back-btn" :disabled="nav.path.length <= 1" @click="back">‹ Zoom out</button>
  </nav>
  <main class="stage">
    <WorldScene v-if="current.scene === 'world'" />
    <LegacyScene v-else :key="current.scene + (current.arg ?? '')" :scene="current.scene" :arg="current.arg" />
  </main>
  <InfoPanel v-bind="info" />
  <div class="legend"><!-- copy bottom-legend inner markup from markup.html verbatim --></div>
</template>
<script setup lang="ts">
import { useSceneNav, type SceneEntry } from "../composables/useSceneNav";
import { useSolutionData } from "../composables/useSolutionData";
import { useTimeEngine } from "../composables/useTimeEngine";
import { useStatus } from "../composables/useStatus";
import { useInfoPanel } from "../composables/useInfoPanel";
import WorldScene from "./scenes/WorldScene.vue";
import LegacyScene from "./scenes/LegacyScene.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import SampleDataBadge from "./shared/SampleDataBadge.vue";

const { nav, current, back, jumpTo, go } = useSceneNav();
const data = useSolutionData();
const { time } = useTimeEngine();
useStatus();
const { info } = useInfoPanel();

const SCENE_LABELS: Record<string, string> = { world: "Global", tenants: "Tenancy", region: "Region", platform: "Virto Commerce", heatmap: "Customization" };
function label(entry: SceneEntry) {
  if (entry.scene === "region" && entry.arg) return data.model.regions.find(r => r.id === entry.arg)?.name ?? entry.arg;
  return SCENE_LABELS[entry.scene];
}
function toggleHeatmap() { current.value.scene === "heatmap" ? back() : go("heatmap"); }
</script>
```

Also create `composables/useInfoPanel.ts` (12 lines — reactive `{ kic, title, subtitle, bodyHtml }` + `setInfo()` setter, exported like the other composables).

- [ ] **Step 4: Create the world components.** Complete specifications:

`world/DaylightBand.vue` — props `{ minute: number }`; template is the `<defs>` dayBand gradient + clipped `<rect class="daylight">` from `markup.html`; computed `gradientTransform` = `translate(${projX(180 - (minute/1440)*360) - 500},0)`.

`world/WorldMap.vue` — props `{ regions, connections, metric, valueAt, stateOf, minute }`. Template: the `<svg class="worldmap">` block from `markup.html` (ocean/defs/graticule/land/tenant-zone), with `v-for` region nodes and flow paths replacing the engine's `buildWorld()` string building. Land path imported from new `src/data/landPath.ts` (`export const LAND_PATH = "…"` — cut the `d` string out of markup.html). Region node markup identical to engine's template (`region-node` group + labels + value + segmented bar as 12 `rect.pseg` with `:fill` computed from `valueAt(region.id)/capacity`). Flow arc `d` computed with the engine's quadratic formula (copy `projX/projY` + arc math into `src/data/projection.ts` and import in both WorldMap and DaylightBand). Emits `drill(regionId)`.

`world/ConnectionsCard.vue` — template = the `.conn-card` block; local `activeFlow` ref; emits `focus(type|null)`; parent `WorldScene` passes it down to `WorldMap` which sets `data-focus` attr on the svg.

`world/MetricDashboard.vue` — template = the `.world-dash` block; wires `useTimeEngine` controls (`play/scrub/speed/metric`) and renders KPI row (`req`, `users`, `orders/24h` from `ordersToday`, `instances`) + day chart path (rebuild `buildDayChart` as a computed producing the polyline `d` from `globalAt` samples every 30 min).

`scenes/WorldScene.vue` — composition root: template = scene-head from the world `<section>` + `<WorldMap …>` + `<ConnectionsCard …>` + `<MetricDashboard …>`; sets info-panel overview on mount (port `setInfoOverview('world')` body into `useInfoPanel().setInfo(...)` call); `@drill` → `go('region', id)`.

- [ ] **Step 5: Switch `App.vue`**

```vue
<template><AppShell /></template>
<script setup lang="ts">
import AppShell from "./components/AppShell.vue";
</script>
```

(`SolutionMap.vue` becomes unused — delete it: `git rm client-app/src/components/SolutionMap.vue`.)

- [ ] **Step 6: Build + world parity gate**

Run: `npm run build` → 0 TS errors. Parity (browser): 5 regions on real land map; daylight band sweeps; play/scrub/speed/metric toggle work; KPIs + trend arrows update; orders KPI accumulates; connections card focuses/dims flows; region click opens the **legacy** region scene (bridge working); breadcrumb + Zoom out work; health pill green; no console errors.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: componentized AppShell + WorldScene (legacy bridge for remaining scenes)"
```

---

### Task 10: HeatmapScene

**Files:**
- Create: `client-app/src/components/scenes/HeatmapScene.vue`
- Modify: `client-app/src/components/AppShell.vue` (route `heatmap` to it)

- [ ] **Step 1: Create `HeatmapScene.vue`.** Template = the `<section class="scene" data-scene="heatmap">` block. Script (complete):

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { useSolutionData } from "../../composables/useSolutionData";
import { useInfoPanel } from "../../composables/useInfoPanel";
import type { ComponentDto } from "../../api/types";

const HT_LEVELS = [
  { label: "Standard",   color: "#2B7FFF", desc: "Out-of-the-box Virto component. Maintained by Virto and covered by the Virto Guarantee." },
  { label: "Configured", color: "#38BDF8", desc: "Standard code adapted through configuration / settings only — still Virto-maintained." },
  { label: "Extended",   color: "#F59E0B", desc: "Standard component extended with custom code or integration points. Shared responsibility." },
  { label: "Custom",     color: "#FF6A3D", desc: "Bespoke build — owned and maintained by your implementation partner / you." },
];
const HT_OWNER = ["Virto", "Virto", "Virto + custom code", "Partner / custom"];

const data = useSolutionData();
const { setInfo } = useInfoPanel();
const filter = ref<"all" | "custom" | "standard">("all");
const selected = ref<string | null>(null);

const groups = computed(() => ([
  { key: "cloud",    title: "Virto Cloud · Infrastructure",        items: data.customization.items.filter(i => i.group === "cloud") },
  { key: "commerce", title: "Virto Commerce · Platform & Modules", items: data.customization.items.filter(i => i.group === "commerce") },
]));
const all = computed(() => data.customization.items);
const tailored = computed(() => all.value.filter(i => i.level >= 2).length);
const stdPct = computed(() => Math.round((all.value.length - tailored.value) / Math.max(1, all.value.length) * 100));

function visible(item: ComponentDto) {
  return filter.value === "all" || (filter.value === "custom" && item.level >= 2) || (filter.value === "standard" && item.level <= 1);
}
function select(item: ComponentDto) {
  selected.value = item.id;
  const lv = HT_LEVELS[item.level];
  setInfo({
    kic: "● Component", title: item.name,
    subtitle: item.group === "cloud" ? "Virto Cloud · Infrastructure" : "Virto Commerce · Platform & Modules",
    bodyHtml: `
      <div class="kv">
        <div class="row"><span class="k">Customization</span><span class="v" style="color:${lv.color}">${lv.label.toUpperCase()}</span></div>
        <div class="row"><span class="k">Owner</span><span class="v">${item.owner ?? HT_OWNER[item.level]}</span></div>
        <div class="row"><span class="k">Support</span><span class="v" style="color:${item.level <= 1 ? "var(--ok)" : "var(--warn)"}">${item.level <= 1 ? "VIRTO GUARANTEE" : "TAILORED"}</span></div>
        ${item.version ? `<div class="row"><span class="k">Version</span><span class="v">${item.version}</span></div>` : ""}
      </div>
      <p>${item.note ?? lv.desc}</p>`,
  });
}
</script>
```

Template bindings replace the engine's string-built tiles with `v-for` over `groups`/`visible`, `:class="'ht-tile lvl-' + item.level + (selected===item.id ? ' sel' : '')"`, `@click="select(item)"`; the ratio bar uses `stdPct`; filter buttons set `filter`.

- [ ] **Step 2: Route it in `AppShell.vue`** — add `<HeatmapScene v-else-if="current.scene === 'heatmap'" />` before the `LegacyScene` fallback.

- [ ] **Step 3: Build + parity gate**

`npm run build` → 0 errors. Parity: tiles grouped cloud/commerce; **live** platform shows real installed modules (Catalog etc. level 0) when logged in; ratio bar reflects live counts; filters isolate; tile click fills info panel; badge shows when running standalone (`npm run dev`).

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: componentized HeatmapScene bound to /customization"`

---

### Task 11: RegionScene

**Files:**
- Create: `client-app/src/data/regionInternals.ts` — move the engine's `REGIONS` config + `VER` object verbatim into a typed export (presentational data, spec §11):

```typescript
export const VER = { aks: "1.32.9", sql: "12.0", es: "8.19.7", redis: "7.4", nginx: "1.26.3", os: "Ubuntu 5.15.0-1091", afd: "Premium + WAF" };
export interface RegionNode { key: string; label: string; azure?: string; ver?: string; cls?: string; }
export interface RegionInternals { lead: string; edge: RegionNode[]; aks: RegionNode[]; data: RegionNode[]; ops: RegionNode[]; }
export const REGION_INTERNALS: Record<string, RegionInternals> = { /* copy engine's REGIONS config object literally, converting R(...) template calls to their expanded objects */ };
```

- Create: `client-app/src/components/scenes/RegionScene.vue` — props `{ regionId: string }`. Template = the region `<section>` block with `v-for` tiers replacing `renderRegion()`'s string building; the AKS cluster renders nginx → arrow → backend column (each backend `@click="go('platform')"`, keeping the `drill-tag`); region tab buttons `@click="go('region', id)"` (replace current path entry, not push — use `jumpTo(nav.path.length - 2)` then `go`). Node click → info panel via the engine's `NODES` knowledge base — move that object verbatim to `client-app/src/data/nodeCatalog.ts` and render the same `statRows`+desc HTML in `setInfo`.
- Modify: `AppShell.vue` — route `region` scene, passing `current.arg` as `regionId`.

- [ ] **Step 1: Create the two data files** (verbatim moves from the engine as described above).
- [ ] **Step 2: Create `RegionScene.vue`** with the template copy + bindings; status dots use `stateOf(node.key)`.
- [ ] **Step 3: Route in `AppShell.vue`.**
- [ ] **Step 4: Build + parity gate.** World → click region → tier layout matches engine (Edge → AKS cluster → Data → Platform services); versions shown; region tabs switch; backend click opens platform scene (still legacy); node click fills info panel with status/latency.
- [ ] **Step 5: Commit** — `git commit -am "feat: componentized RegionScene"`

---

### Task 12: TenantsScene + PlatformScene

**Files:**
- Create: `client-app/src/components/scenes/TenantsScene.vue` — template = tenants `<section>`; tenant cards render from `data.model.tenants` (name/cloud/description) with the mini node chips kept static from the markup; "Open internals" buttons `@click="go('region', 'china' | 'eastus2')"`.
- Create: `client-app/src/components/scenes/PlatformScene.vue` — template = platform `<section>`; local `view` ref toggles `arch | xapi` (the `ptoggle`); OOB/custom module tiles render from `data.customization.items.filter(i => i.group === 'commerce')` split by `level <= 1` (OOB) / `level >= 2` (custom); Luminos Labs partner card kept from markup (external link); "Open the customization heat map" → `go('heatmap')`.
- Modify: `AppShell.vue` — route both; **delete `LegacyScene.vue` route fallback** (all scenes now native).

- [ ] **Step 1: Create both scenes** (template copies + bindings above; scripts follow the exact HeatmapScene pattern: `useSolutionData` + `useSceneNav` + `useInfoPanel`).
- [ ] **Step 2: Route in `AppShell.vue`;** remove the `LegacyScene` import/usage.
- [ ] **Step 3: Build + parity gate.** Tenants: two cards + boundary + syncer; drill buttons work. Platform: arch/xapi toggle; module tiles reflect live customization data; Luminos link opens; heat-map button navigates.
- [ ] **Step 4: Commit** — `git commit -am "feat: componentized Tenants + Platform scenes; legacy bridge removed from routes"`

---

### Task 13: Delete the engine + full parity pass

**Files:**
- Delete: `client-app/src/engine/solutionMap.js`, `client-app/src/engine/markup.html`, `client-app/src/components/scenes/LegacyScene.vue`

- [ ] **Step 1: Delete**

```bash
git rm client-app/src/engine/solutionMap.js client-app/src/engine/markup.html client-app/src/components/scenes/LegacyScene.vue
rmdir client-app/src/engine 2>/dev/null || true
```

- [ ] **Step 2: Full build** — `npm run build` → 0 TS errors, no unresolved imports.
- [ ] **Step 3: Full parity checklist** (browser, live platform):
  - World: 5 regions, land map, flows animate, daylight band sweeps, connections focus, metric toggle ×4, play/scrub/speed, KPIs + orders/24h accumulate, health pill.
  - Drill: region → internals → backend → platform; tenants via world/tenants path; Esc/back/breadcrumb.
  - Heatmap: live modules, filters, ratio, tile info.
  - Badge appears when logged out (401 fallback); no unhandled console errors anywhere.
- [ ] **Step 4: Commit** — `git commit -am "refactor: remove ported engine — app is fully componentized"`

---

## Phase D — Hygiene (Tasks 14–16)

### Task 14: Remove the AngularJS stub

**Files:**
- Delete: `src/VirtoCommerce.SolutionArchitectureMap.Web/Scripts/` (whole folder), `Web/webpack.config.js`, `Web/package.json`, `Web/package-lock.json`

- [ ] **Step 1: Confirm no references** — `grep -r "Scripts/" src/VirtoCommerce.SolutionArchitectureMap.Web/module.manifest src/VirtoCommerce.SolutionArchitectureMap.Web/*.csproj` → no matches (the manifest has no `<scripts>` element).
- [ ] **Step 2: Delete**

```bash
git rm -r src/VirtoCommerce.SolutionArchitectureMap.Web/Scripts src/VirtoCommerce.SolutionArchitectureMap.Web/webpack.config.js src/VirtoCommerce.SolutionArchitectureMap.Web/package.json src/VirtoCommerce.SolutionArchitectureMap.Web/package-lock.json
```

- [ ] **Step 3: Build backend** — `dotnet build src/...Web.csproj` → 0/0 (platform loads localizations regardless; nothing references Scripts).
- [ ] **Step 4: Commit** — `git commit -m "chore: remove unused AngularJS admin-UI stub"`

---

### Task 15: Packaging — csproj npm target + module.ignore

**Files:**
- Modify: `src/VirtoCommerce.SolutionArchitectureMap.Web/VirtoCommerce.SolutionArchitectureMap.Web.csproj`
- Modify: `module.ignore` (repo root)

- [ ] **Step 1: Add the Release-only npm build target** inside the csproj's root `<Project>` element:

```xml
<!-- Build the Vue app into Content/solution-architecture-map before Release builds
     (vc-build Compress uses Release). Debug builds skip it — use `npm run dev`.
     Opt out with -p:SkipClientApp=true -->
<Target Name="BuildClientApp" BeforeTargets="Build"
        Condition="'$(Configuration)' == 'Release' AND '$(SkipClientApp)' != 'true'">
  <Exec Command="npm ci" WorkingDirectory="client-app" />
  <Exec Command="npm run build" WorkingDirectory="client-app" />
</Target>
```

- [ ] **Step 2: Extend `module.ignore`** (one pattern per line — excludes dev sources from the module zip):

```
client-app
node_modules
webpack.config.js
```

- [ ] **Step 3: Verify packaging** — `vc-build Compress` (repo root). Expected: `artifacts/VirtoCommerce.SolutionArchitectureMap_3.1000.0.zip`; inspect: contains `Content/solution-architecture-map/index.html` + assets, does NOT contain `client-app/` or `node_modules/`.

```bash
python -c "import zipfile,glob; z=zipfile.ZipFile(glob.glob('artifacts/*.zip')[0]); names=z.namelist(); print('has app:', any('Content/solution-architecture-map/index.html' in n for n in names)); print('leaked client-app:', any('client-app/src' in n for n in names))"
```

Expected: `has app: True`, `leaked client-app: False`.
- [ ] **Step 4: Commit** — `git commit -am "build: npm build wired into Release; module.ignore excludes app sources"`

---

### Task 16: README + final verification

**Files:**
- Rewrite: `README.md` (repo root)

- [ ] **Step 1: Write README.md** covering (each with concrete commands/values from this plan): what the module is (1 paragraph + screenshot placeholder path `docs/media/`); install (zip via Modules → Advanced, or dev symlink into `platform/modules`); the `solution-architecture-map:access` permission; settings — `SolutionArchitectureMap.Enabled`, `SolutionArchitectureMap.CustomizationOverrides` with the JSON example from spec §5.3 and the key rules (module ids or `h_*` ids; fields level/owner/note/group/hidden); REST endpoints table (4 rows: path, purpose, params); dev workflow (`npm run dev` standalone mock · `npm run build` → `Content/solution-architecture-map` · platform serves `/apps/{appId}` from `Content/{appId}` and fails startup if missing · Release dotnet build runs npm automatically); architecture sketch (providers → controller → Vue app; sample vs live dataSource).
- [ ] **Step 2: Final full verification**
  - `dotnet build` (Release): `dotnet build src/...Web.csproj -c Release` → runs npm, 0/0.
  - `dotnet test` → all green.
  - Platform restart → App Menu tile opens the app; full parity checklist from Task 13 Step 3 once more.
- [ ] **Step 3: Commit** — `git commit -am "docs: production README (install, settings, API, dev workflow)"`

---

## Plan self-review record

- **Spec coverage:** §4 API → Tasks 1–5; §5 providers/heuristic/overrides → Tasks 3–4; §6 componentization + port order + parity → Tasks 8–13; §7 auth → Task 6 Step 4 gate + Task 7 client; §8 packaging/hygiene/README → Tasks 14–16; §9 tests → Tasks 3/4/5 (+`vue-tsc` in every build); §10 error matrix → Task 7 fallbacks, Task 8 `useStatus.stale`, badge in Task 9. No uncovered spec sections.
- **Known judgment calls encoded:** LegacyScene bridge (with sanctioned branch fallback, Task 8 preamble); region internals stay client-side data (spec §11); mock metrics generator mirrors server formula.
- **Type consistency check:** `ComponentDto`/`RegionDto` field names identical across C# (camelCase serialized), `types.ts`, and component props; `useSceneNav.go/back/jumpTo` used consistently in Tasks 9–12.
