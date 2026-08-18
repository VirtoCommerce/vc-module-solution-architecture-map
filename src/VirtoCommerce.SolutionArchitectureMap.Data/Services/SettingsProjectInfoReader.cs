using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VirtoCommerce.Platform.Core.Settings;
using VirtoCommerce.SolutionArchitectureMap.Core;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

/// <summary>
/// Reads project branding (customer title/logo, implementation partner) from the
/// SolutionArchitectureMap.ProjectInfo setting. Malformed JSON falls back to defaults.
/// </summary>
public class SettingsProjectInfoReader(ISettingsManager settingsManager, ILogger<SettingsProjectInfoReader> logger) : IProjectInfoReader
{
    public async Task<ProjectInfoDto> GetProjectInfoAsync()
    {
        var json = await settingsManager.GetValueAsync<string>(ModuleConstants.Settings.General.ProjectInfo);
        return Parse(json, logger);
    }

    public static ProjectInfoDto Parse(string json, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new ProjectInfoDto();
        }
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var result = JsonSerializer.Deserialize<ProjectInfoDto>(json, options) ?? new ProjectInfoDto();
            // Defensive: partial JSON must never null out sections the UI binds to.
            result.Customer ??= new CustomerInfoDto();
            result.Partner ??= new PartnerInfoDto();
            return result;
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "ProjectInfo setting is not valid JSON; using default project info");
            return new ProjectInfoDto();
        }
    }
}
