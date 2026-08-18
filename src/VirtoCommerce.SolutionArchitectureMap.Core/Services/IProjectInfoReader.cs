using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Services;

public interface IProjectInfoReader
{
    Task<ProjectInfoDto> GetProjectInfoAsync();
}
