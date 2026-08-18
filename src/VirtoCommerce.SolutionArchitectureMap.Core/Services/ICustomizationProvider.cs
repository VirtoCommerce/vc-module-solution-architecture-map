using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

/// <summary>Supplies the standard-vs-custom inventory for GET /customization.</summary>
public interface ICustomizationProvider
{
    Task<CustomizationResult> GetCustomizationAsync();
}
