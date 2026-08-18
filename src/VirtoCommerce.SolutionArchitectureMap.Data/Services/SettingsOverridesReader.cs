using System.Threading.Tasks;
using VirtoCommerce.Platform.Core.Settings;
using VirtoCommerce.SolutionArchitectureMap.Core;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

/// <summary>Reads the CustomizationOverrides platform setting.</summary>
public class SettingsOverridesReader(ISettingsManager settingsManager) : IOverridesReader
{
    public async Task<string> GetOverridesJsonAsync() =>
        await settingsManager.GetValueAsync<string>(ModuleConstants.Settings.General.CustomizationOverrides) ?? "{}";
}
