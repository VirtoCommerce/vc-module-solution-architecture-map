using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

public record InstalledModule(string Id, string Title, string Version, IList<string> Authors, IList<string> Owners);

public interface IInstalledModulesReader
{
    IList<InstalledModule> GetInstalledModules();
}
