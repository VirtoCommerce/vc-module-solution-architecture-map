using System.Collections.Generic;
using System.Linq;
using VirtoCommerce.Platform.Core.Modularity;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

/// <summary>
/// Reads the platform's installed-modules catalog via IModuleService (the current, non-obsolete
/// read API - ILocalModuleCatalog is obsolete in this platform version in favor of ModuleBootstrapper).
/// </summary>
public class LocalInstalledModulesReader(IModuleService moduleService) : IInstalledModulesReader
{
    public IList<InstalledModule> GetInstalledModules() =>
        moduleService.GetInstalledModules()
            .Select(m => new InstalledModule(
                m.Id,
                m.Title ?? m.Id,
                m.Version?.ToString() ?? "",
                m.Authors?.ToList() ?? [],
                m.Owners?.ToList() ?? []))
            .ToList();
}
