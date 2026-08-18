using System.Threading.Tasks;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

public interface ITopologyReader
{
    Task<string> GetTopologyJsonAsync();
}
