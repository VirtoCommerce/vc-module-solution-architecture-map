using System;
using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

public class MetricsResult
{
    public string DataSource { get; set; } = "sample";
    public string Metric { get; set; }
    public IList<MetricSeries> Series { get; set; } = new List<MetricSeries>();
}

public class MetricSeries
{
    public string RegionId { get; set; }
    public IList<MetricPoint> Points { get; set; } = new List<MetricPoint>();
}

public class MetricPoint
{
    public DateTime Ts { get; set; }
    public double Value { get; set; }
}
