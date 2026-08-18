using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

public class SampleStatusProvider : IServiceStatusProvider
{
    public Task<StatusResult> GetStatusesAsync() =>
        Task.FromResult(new StatusResult { DataSource = "sample", Statuses = SampleData.Statuses() });
}
