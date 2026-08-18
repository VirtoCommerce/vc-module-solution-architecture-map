using System.Threading.Tasks;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

public interface IOverridesReader
{
    Task<string> GetOverridesJsonAsync();
}
