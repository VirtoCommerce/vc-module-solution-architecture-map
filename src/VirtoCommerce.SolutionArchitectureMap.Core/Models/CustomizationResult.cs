using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

public class CustomizationResult
{
    /// <summary>"sample" or "live".</summary>
    public string DataSource { get; set; } = "sample";
    public IList<ComponentDto> Items { get; set; } = new List<ComponentDto>();
}

/// <summary>Optional per-item override, deserialized from the CustomizationOverrides setting.</summary>
public class CustomizationOverride
{
    public int? Level { get; set; }
    public string Owner { get; set; }
    public string Note { get; set; }
    public string Group { get; set; }
    public bool? Hidden { get; set; }
}
