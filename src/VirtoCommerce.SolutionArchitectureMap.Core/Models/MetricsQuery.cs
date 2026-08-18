using System;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

public class MetricsQuery
{
    public static readonly string[] KnownMetrics = ["requests", "users", "orders", "instances"];

    public string Metric { get; set; } = "requests";
    /// <summary>Window start (UTC). Defaults to To − 24h.</summary>
    public DateTime? From { get; set; }
    /// <summary>Window end (UTC). Defaults to now.</summary>
    public DateTime? To { get; set; }
    /// <summary>Point spacing in minutes, 5–120.</summary>
    public int Granularity { get; set; } = 30;
}
