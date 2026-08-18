using System.Collections.Generic;
using VirtoCommerce.SolutionArchitectureMap.Core.Models;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

/// <summary>
/// Single home for the sample component/status data used by the Sample* providers.
/// (The topology now lives in the SolutionArchitectureMap.Topology setting default —
/// see StaticTopologyProvider.)
/// Every accessor below returns a fresh, caller-owned copy on each call — callers (e.g.
/// ManifestCustomizationProvider) rely on this to mutate returned items in place safely.
/// Do not "optimize" these into cached static instances.
/// </summary>
public static class SampleData
{
    /// <summary>All 30 heat-map components (12 cloud + 18 commerce) — copy of BuildComponents().</summary>
    public static IList<ComponentDto> Components() =>
    [
        // Virto Cloud (infrastructure)
        new() { Id = "h_aks", Name = "Azure Kubernetes Service", Group = "cloud", Level = 0, AzureService = "AKS", Version = "1.32.9", Owner = "Virto" },
        new() { Id = "h_afd", Name = "Front Door + WAF", Group = "cloud", Level = 0, AzureService = "AFD Premium + WAF", Owner = "Virto" },
        new() { Id = "h_sql", Name = "Azure SQL (geo-replicas)", Group = "cloud", Level = 0, AzureService = "Azure SQL", Version = "12.0", Owner = "Virto" },
        new() { Id = "h_redis", Name = "Azure Managed Redis", Group = "cloud", Level = 0, AzureService = "Redis", Version = "7.4", Owner = "Virto" },
        new() { Id = "h_es", Name = "Elasticsearch", Group = "cloud", Level = 0, Version = "8.19.7", Owner = "Virto" },
        new() { Id = "h_kv", Name = "Key Vault", Group = "cloud", Level = 0, AzureService = "Azure Key Vault", Owner = "Virto" },
        new() { Id = "h_mon", Name = "Monitoring / App Insights", Group = "cloud", Level = 0, AzureService = "Azure Monitor", Owner = "Virto" },
        new() { Id = "h_argo", Name = "Argo CD · vc-build CI/CD", Group = "cloud", Level = 0, Owner = "Virto" },
        new() { Id = "h_tenant", Name = "21Vianet tenant setup", Group = "cloud", Level = 1, Owner = "Virto + client" },
        new() { Id = "h_afdr", Name = "Per-region AFD routing", Group = "cloud", Level = 2, Note = "Thin networking layer hardened with new QA gates." },
        new() { Id = "h_ingress", Name = "NGINX ingress topology", Group = "cloud", Level = 2, Note = "Region-specific ingress customization." },
        new() { Id = "h_syncer", Name = "Cross-region DB Syncer", Group = "cloud", Level = 3, Owner = "Virto (custom component)", Note = "Bi-directional China⇄US sync." },
        // Virto Commerce (platform & modules)
        new() { Id = "h_cat", Name = "Catalog", Group = "commerce", Level = 0 },
        new() { Id = "h_cart", Name = "Cart", Group = "commerce", Level = 0 },
        new() { Id = "h_ord", Name = "Orders", Group = "commerce", Level = 0 },
        new() { Id = "h_cust", Name = "Customer", Group = "commerce", Level = 0 },
        new() { Id = "h_mkt", Name = "Marketing", Group = "commerce", Level = 0 },
        new() { Id = "h_inv", Name = "Inventory", Group = "commerce", Level = 0 },
        new() { Id = "h_cms", Name = "Content / CMS", Group = "commerce", Level = 0 },
        new() { Id = "h_sidx", Name = "Search Index", Group = "commerce", Level = 0 },
        new() { Id = "h_ei", Name = "Export / Import", Group = "commerce", Level = 0 },
        new() { Id = "h_price", Name = "Pricing", Group = "commerce", Level = 1, Note = "Standard module driven by price-list config." },
        new() { Id = "h_ship", Name = "Shipping", Group = "commerce", Level = 1 },
        new() { Id = "h_pay", Name = "Payment", Group = "commerce", Level = 1 },
        new() { Id = "h_xapi", Name = "GraphQL XAPI", Group = "commerce", Level = 1 },
        new() { Id = "h_fe", Name = "Vue 3 Frontend theme", Group = "commerce", Level = 1, Note = "Storefront-less SPA with theming & brand config." },
        new() { Id = "h_rules", Name = "Thorlabs Catalog Rules", Group = "commerce", Level = 3, Owner = "Luminos Labs" },
        new() { Id = "h_erp", Name = "ERP Integration", Group = "commerce", Level = 3, Owner = "Luminos Labs" },
        new() { Id = "h_chk", Name = "Custom Checkout", Group = "commerce", Level = 3, Owner = "Luminos Labs" },
        new() { Id = "h_rprice", Name = "Region Pricing Logic", Group = "commerce", Level = 3, Owner = "Luminos Labs" },
    ];

    /// <summary>Only the infrastructure ("cloud") rows — used by the customization provider (later task).</summary>
    public static IList<ComponentDto> InfrastructureComponents()
    {
        var result = new List<ComponentDto>();
        foreach (var c in Components())
        {
            if (c.Group == "cloud") result.Add(c);
        }
        return result;
    }

    public static IList<ServiceStatusDto> Statuses() =>
    [
        new() { ComponentId = "h_syncer", State = "healthy", LatencyMs = 34 },
        new() { ComponentId = "h_sql", State = "healthy", LatencyMs = 12 },
    ];
}
