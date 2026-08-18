using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>Supplies per-region time series for GET /metrics.</summary>
public interface IMetricsProvider
{
    Task<MetricsResult> GetMetricsAsync(MetricsQuery query);
}
