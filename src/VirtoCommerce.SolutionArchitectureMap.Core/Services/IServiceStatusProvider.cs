using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>Supplies live service states for GET /status (polled).</summary>
public interface IServiceStatusProvider
{
    Task<StatusResult> GetStatusesAsync();
}
