using System.Collections.Generic;

namespace VirtoCommerce.SolutionArchitectureMap.Core.Models;

// API contract for the Solution Architecture Map app. Serialized camelCase by the
// platform, so it matches client-app/src/api/types.ts exactly.

public class SolutionMapModel
{
    /// <summary>"sample" (mock) or "live" (real Virto Cloud data).</summary>
    public string DataSource { get; set; } = "sample";
    public PlatformInfo Platform { get; set; } = new();
    public ProjectInfoDto Project { get; set; } = new();
    public IList<TenantDto> Tenants { get; set; } = new List<TenantDto>();
    public IList<RegionDto> Regions { get; set; } = new List<RegionDto>();
    public IList<ConnectionDto> Connections { get; set; } = new List<ConnectionDto>();
    /// <summary>Virto Cloud datacenter catalog (hosting options); Current marks the solution's hosting.</summary>
    public IList<DatacenterDto> Datacenters { get; set; } = new List<DatacenterDto>();
    public MetricMaxDto MetricMax { get; set; } = new();
    /// <summary>Product count from the search index ("Product" documents); null when unavailable.</summary>
    public long? CatalogSize { get; set; }
}

public class PlatformInfo
{
    public string Name { get; set; } = "Virto Commerce";
    public string Version { get; set; } = string.Empty;
}

/// <summary>Project branding, loaded from the SolutionArchitectureMap.ProjectInfo setting.</summary>
public class ProjectInfoDto
{
    public CustomerInfoDto Customer { get; set; } = new();
    public PartnerInfoDto Partner { get; set; } = new();
}

public class CustomerInfoDto
{
    public string Title { get; set; } = "Extra Large";
    public string LogoUrl { get; set; } = "";
}

public class PartnerInfoDto
{
    public string Name { get; set; } = "Implementation Partner";
    public string Website { get; set; } = "";
    public string LogoUrl { get; set; } = "";
}

/// <summary>A Virto Cloud datacenter location (hosting option).</summary>
public class DatacenterDto
{
    public string Id { get; set; }
    public string Name { get; set; }
    public double Lat { get; set; }
    public double Lon { get; set; }
    /// <summary>True when the current solution is hosted in this datacenter.</summary>
    public bool Current { get; set; }
}

public class TenantDto
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Cloud { get; set; }
    public string Description { get; set; }
}

public class RegionDto
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string City { get; set; }
    public double Lat { get; set; }
    public double Lon { get; set; }
    public string TenantId { get; set; }
    /// <summary>master-write | read-replica | read-cache | local-rw</summary>
    public string Role { get; set; }
    public bool Master { get; set; }
    /// <summary>UTC offset in hours — drives the follow-the-sun diurnal curve.</summary>
    public int TzOffset { get; set; }
    /// <summary>Relative traffic scale vs the master region (0..1).</summary>
    public double Weight { get; set; }
    /// <summary>Operational health of this region's deployment: healthy | degraded | down. Drives the marker color; defaults to healthy.</summary>
    public string Health { get; set; }
}

public class ConnectionDto
{
    public string From { get; set; }
    public string To { get; set; }
    /// <summary>replication | mutation | syncer</summary>
    public string Type { get; set; }
}

public class ComponentDto
{
    public string Id { get; set; }
    public string Name { get; set; }
    /// <summary>cloud | commerce</summary>
    public string Group { get; set; }
    /// <summary>0 standard · 1 configured · 2 extended · 3 custom.</summary>
    public int Level { get; set; }
    public string Owner { get; set; }
    public string AzureService { get; set; }
    public string Version { get; set; }
    public string Note { get; set; }
}

public class ServiceStatusDto
{
    public string ComponentId { get; set; }
    /// <summary>healthy | degraded | down</summary>
    public string State { get; set; }
    public int? LatencyMs { get; set; }
}

public class MetricMaxDto
{
    public int Requests { get; set; }
    public int Users { get; set; }
    public int Orders { get; set; }
    public int Instances { get; set; }
}
