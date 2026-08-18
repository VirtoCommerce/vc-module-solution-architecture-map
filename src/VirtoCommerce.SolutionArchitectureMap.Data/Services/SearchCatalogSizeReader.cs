using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VirtoCommerce.SearchModule.Core.Model;
using VirtoCommerce.SearchModule.Core.Services;
using VirtoCommerce.SolutionArchitectureMap.Core.Services;

namespace VirtoCommerce.SolutionArchitectureMap.Data.Services;

/// <summary>
/// Reads the catalog size as the "Product" document count from the search index.
/// ISearchProvider is resolved lazily via the service provider, so the map module works
/// (returning null -> UI falls back to the fleet-wide stat) on platforms without the
/// Search module. The count is cached for 5 minutes.
/// </summary>
public class SearchCatalogSizeReader(IServiceProvider serviceProvider, ILogger<SearchCatalogSizeReader> logger) : ICatalogSizeReader
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    private sealed record CacheEntry(DateTime At, long? Count);
    private volatile CacheEntry _cache;

    public async Task<long?> GetProductCountAsync()
    {
        var cached = _cache;
        if (cached != null && DateTime.UtcNow - cached.At < CacheTtl)
        {
            return cached.Count;
        }

        long? count = null;
        try
        {
            var searchProvider = serviceProvider.GetService<ISearchProvider>();
            if (searchProvider != null)
            {
                var response = await searchProvider.SearchAsync(KnownDocumentTypes.Product, new SearchRequest { Take = 0 });
                count = response?.TotalCount;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to read the product count from the search index");
        }

        _cache = new CacheEntry(DateTime.UtcNow, count);
        return count;
    }
}
