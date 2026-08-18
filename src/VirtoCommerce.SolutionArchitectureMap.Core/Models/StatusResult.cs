using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

public class StatusResult
{
    public string DataSource { get; set; } = "sample";
    public IList<ServiceStatusDto> Statuses { get; set; } = new List<ServiceStatusDto>();
}
