using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

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
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private sealed record CacheEntry(DateTime At, CustomizationResult Result);
    private volatile CacheEntry _cache;   // reference write is atomic — safe under concurrent requests

    public async Task<CustomizationResult> GetCustomizationAsync()
    {
        var cached = _cache;
        if (cached != null && DateTime.UtcNow - cached.At < CacheTtl)
        {
            return cached.Result;
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
                // Real Virto manifests list individual developers as authors, so author alone
                // is unreliable. Strong signals: the module id prefix and the owners field.
                var isVirto =
                    module.Id.StartsWith("VirtoCommerce.", StringComparison.OrdinalIgnoreCase) ||
                    module.Owners.Concat(module.Authors)
                        .Any(a => string.Equals(a?.Trim(), "Virto Commerce", StringComparison.OrdinalIgnoreCase));
                items.Add(new ComponentDto
                {
                    Id = module.Id,
                    Name = module.Title,
                    Group = "commerce",
                    Level = isVirto ? 0 : 3,
                    Owner = isVirto ? "Virto" : (module.Owners.FirstOrDefault() ?? module.Authors.FirstOrDefault() ?? "Custom"),
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
                if (o.Hidden == true)
                {
                    continue;
                }
                if (o.Level.HasValue)
                {
                    item.Level = Math.Clamp(o.Level.Value, 0, 3);
                }
                if (!string.IsNullOrEmpty(o.Owner))
                {
                    item.Owner = o.Owner;
                }
                if (!string.IsNullOrEmpty(o.Note))
                {
                    item.Note = o.Note;
                }
                if (!string.IsNullOrEmpty(o.Group))
                {
                    item.Group = o.Group;
                }
            }
            merged.Add(item);
        }

        var result = new CustomizationResult { DataSource = dataSource, Items = merged };
        _cache = new CacheEntry(DateTime.UtcNow, result);
        return result;
    }

    internal static Dictionary<string, CustomizationOverride> ParseOverrides(string json, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }
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
