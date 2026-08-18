using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VirtoCommerce.Platform.Core.Common;
using VirtoCommerce.Platform.Core.Settings;
using VirtoCommerce.SolutionArchitectureMap.Core;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

/// <summary>Reads the SolutionArchitectureMap.Topology platform setting.</summary>
public class SettingsTopologyReader(ISettingsManager settingsManager) : ITopologyReader
{
    public async Task<string> GetTopologyJsonAsync() =>
        await settingsManager.GetValueAsync<string>(ModuleConstants.Settings.General.Topology) ?? string.Empty;
}

/// <summary>
/// Serves the solution topology from the SolutionArchitectureMap.Topology JSON setting
/// (camelCase, same shape as the GET /model payload minus project/dataSource). The setting's
/// default value is the Thorlabs reference architecture; empty or malformed JSON falls back
/// to that default. Project branding is merged in from the ProjectInfo setting.
/// </summary>
public class StaticTopologyProvider(
    ITopologyReader topologyReader,
    IProjectInfoReader projectInfoReader,
    ICatalogSizeReader catalogSizeReader,
    ILogger<StaticTopologyProvider> logger) : ISolutionTopologyProvider
{
    public async Task<SolutionMapModel> GetTopologyAsync()
    {
        var model = Parse(await topologyReader.GetTopologyJsonAsync(), logger);
        model.Project = await projectInfoReader.GetProjectInfoAsync();
        model.CatalogSize = await catalogSizeReader.GetProductCountAsync();
        // Platform identity is never configuration: fixed name + the actually running version.
        model.Platform = new PlatformInfo
        {
            Name = "Virto Commerce",
            Version = PlatformVersion.CurrentVersion?.ToString() ?? string.Empty,
        };
        return model;
    }

    public static SolutionMapModel Parse(string json, ILogger logger)
    {
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        if (!string.IsNullOrWhiteSpace(json))
        {
            try
            {
                var model = JsonSerializer.Deserialize<SolutionMapModel>(json, options);
                if (model != null && model.Regions.Count > 0)
                {
                    return model;
                }
                logger.LogWarning("Topology setting has no regions; using the default topology");
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "Topology setting is not valid JSON; using the default topology");
            }
        }
        // The setting's DefaultValue is the single source of the reference topology.
        return JsonSerializer.Deserialize<SolutionMapModel>(
            (string)ModuleConstants.Settings.General.Topology.DefaultValue, options)!;
    }
}
