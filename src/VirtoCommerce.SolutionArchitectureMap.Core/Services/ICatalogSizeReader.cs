using System.Threading.Tasks;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

public interface ICatalogSizeReader
{
    /// <summary>Product count of the solution's catalog, or null when it cannot be determined.</summary>
    Task<long?> GetProductCountAsync();
}
