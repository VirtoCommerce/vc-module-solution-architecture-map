using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>Supplies the (rarely changing) solution topology for GET /model.</summary>
public interface ISolutionTopologyProvider
{
    Task<SolutionMapModel> GetTopologyAsync();
}
