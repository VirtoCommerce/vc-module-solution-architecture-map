using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

/// <summary>
/// Generates timezone-aware diurnal curves per region (business-hours peak ~13:00 local,
/// evening bump ~20:00) — the same formula the prototype animated client-side.
/// Regions/ceilings come from the topology provider so configured topologies get
/// consistent series. Replace with real telemetry later; the contract stays identical.
/// </summary>
public class SampleMetricsProvider(ISolutionTopologyProvider topologyProvider) : IMetricsProvider
{
    public async Task<MetricsResult> GetMetricsAsync(MetricsQuery query)
    {
        var topology = await topologyProvider.GetTopologyAsync();
        var to = query.To ?? DateTime.UtcNow;
        var from = query.From ?? to.AddHours(-24);
        var granularity = Math.Clamp(query.Granularity, 5, 120);   // defense-in-depth: never infinite-loop on bad input
        var step = TimeSpan.FromMinutes(granularity);

        var result = new MetricsResult { DataSource = "sample", Metric = query.Metric };
        foreach (var region in topology.Regions)
        {
            var series = new MetricSeries { RegionId = region.Id, Points = new List<MetricPoint>() };
            for (var ts = from; ts <= to; ts = ts.Add(step))
            {
                series.Points.Add(new MetricPoint { Ts = ts, Value = ValueAt(query.Metric, region, topology.MetricMax, ts) });
            }
            result.Series.Add(series);
        }
        return result;
    }

    internal static double ValueAt(string metric, RegionDto region, MetricMaxDto max, DateTime tsUtc)
    {
        var localHour = ((tsUtc.TimeOfDay.TotalHours + region.TzOffset) % 24 + 24) % 24;
        var f = Diurnal(localHour);
        return metric switch
        {
            "instances" => Math.Max(3, Math.Round(3 + (max.Instances - 3) * f * region.Weight)),
            "users" => Math.Round(max.Users * region.Weight * f),
            "orders" => Math.Round(max.Orders * region.Weight * f),
            _ => Math.Round(max.Requests * region.Weight * f),
        };
    }

    /// <summary>Normalized load curve 0.04..1 over local hour-of-day (prototype formula).</summary>
    internal static double Diurnal(double h)
    {
        double G(double mu, double s)
        {
            var d = Math.Abs(h - mu);
            d = Math.Min(d, 24 - d);
            return Math.Exp(-(d * d) / (2 * s * s));
        }
        var f = 0.14 + 0.86 * (0.74 * G(13, 3.4) + 0.46 * G(20, 2.1));
        return Math.Clamp(f * 1.16, 0.04, 1.0);
    }
}
