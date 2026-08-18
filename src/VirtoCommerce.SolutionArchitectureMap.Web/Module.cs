using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VirtoCommerce.Platform.Core.Modularity;
using VirtoCommerce.Platform.Core.Security;
using VirtoCommerce.Platform.Core.Settings;
using VirtoCommerce.SolutionArchitectureMap.Core;

namespace VirtoCommerce.SolutionArchitectureMap.Web;

public class Module : IModule, IHasConfiguration
{
    public ManifestModuleInfo ModuleInfo { get; set; }
    public IConfiguration Configuration { get; set; }

    public void Initialize(IServiceCollection serviceCollection)
    {
        // Override models
        //AbstractTypeFactory<OriginalModel>.OverrideType<OriginalModel, ExtendedModel>().MapToType<ExtendedEntity>();
        //AbstractTypeFactory<OriginalEntity>.OverrideType<OriginalEntity, ExtendedEntity>();

        // Register services
        serviceCollection.AddSingleton<Core.Services.ITopologyReader, Data.Services.SettingsTopologyReader>();
        serviceCollection.AddSingleton<Core.Services.ICatalogSizeReader, Data.Services.SearchCatalogSizeReader>();
        serviceCollection.AddSingleton<Core.Services.ISolutionTopologyProvider, Data.Services.StaticTopologyProvider>();
        serviceCollection.AddSingleton<Core.Services.IMetricsProvider, Data.Services.SampleMetricsProvider>();
        serviceCollection.AddSingleton<Core.Services.IServiceStatusProvider, Data.Services.SampleStatusProvider>();
        serviceCollection.AddSingleton<Core.Services.IInstalledModulesReader, Data.Services.LocalInstalledModulesReader>();
        serviceCollection.AddSingleton<Core.Services.IOverridesReader, Data.Services.SettingsOverridesReader>();
        serviceCollection.AddSingleton<Core.Services.IProjectInfoReader, Data.Services.SettingsProjectInfoReader>();
        serviceCollection.AddSingleton<Core.Services.ICustomizationProvider, Data.Services.ManifestCustomizationProvider>();
        serviceCollection.AddSingleton<Core.Services.IIncidentsProvider, Data.Services.SampleIncidentsProvider>();
    }

    public void PostInitialize(IApplicationBuilder appBuilder)
    {
        var serviceProvider = appBuilder.ApplicationServices;

        // Register settings
        var settingsRegistrar = serviceProvider.GetRequiredService<ISettingsRegistrar>();
        settingsRegistrar.RegisterSettings(ModuleConstants.Settings.AllSettings, ModuleInfo.Id);

        // Register permissions
        var permissionsRegistrar = serviceProvider.GetRequiredService<IPermissionsRegistrar>();
        permissionsRegistrar.RegisterPermissions(ModuleInfo.Id, "Solution Architecture Map", ModuleConstants.Security.Permissions.AllPermissions);
    }

    public void Uninstall()
    {
        // Nothing to do here
    }
}
