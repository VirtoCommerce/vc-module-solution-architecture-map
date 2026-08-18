using System.Collections.Generic;
using VirtoCommerce.Platform.Core.Settings;

namespace VirtoCommerce.SolutionArchitectureMap.Core;

public static class ModuleConstants
{
    public static class Security
    {
        public static class Permissions
        {
            public const string Access = "solution-architecture-map:access";
            public const string Create = "solution-architecture-map:create";
            public const string Read = "solution-architecture-map:read";
            public const string Update = "solution-architecture-map:update";
            public const string Delete = "solution-architecture-map:delete";

            public static string[] AllPermissions { get; } =
            [
                Access,
                Create,
                Read,
                Update,
                Delete,
            ];
        }
    }

    public static class Settings
    {
        public static class General
        {
            public static SettingDescriptor SolutionArchitectureMapEnabled { get; } = new()
            {
                Name = "SolutionArchitectureMap.Enabled",
                GroupName = "Solution Architecture Map|General",
                ValueType = SettingValueType.Boolean,
                DefaultValue = false,
            };

            public static SettingDescriptor CustomizationOverrides { get; } = new()
            {
                Name = "SolutionArchitectureMap.CustomizationOverrides",
                GroupName = "Solution Architecture Map|General",
                ValueType = SettingValueType.Json,
                DefaultValue = "{}",
            };

            public static SettingDescriptor ProjectInfo { get; } = new()
            {
                Name = "SolutionArchitectureMap.ProjectInfo",
                GroupName = "Solution Architecture Map|General",
                ValueType = SettingValueType.Json,
                DefaultValue = """
                    {
                      "customer": { "title": "Extra Large", "logoUrl": "" },
                      "partner": { "name": "Implementation Partner", "website": "", "logoUrl": "" }
                    }
                    """,
            };

            /// <summary>
            /// Solution topology served by GET /model (camelCase, same shape as the API payload
            /// minus project/dataSource). Editable per installation; the default is the
            /// Extra Large reference architecture (anonymized).
            /// </summary>
            public static SettingDescriptor Topology { get; } = new()
            {
                Name = "SolutionArchitectureMap.Topology",
                GroupName = "Solution Architecture Map|General",
                ValueType = SettingValueType.Json,
                DefaultValue = """
                    {
                      "tenants": [
                        { "id": "china", "name": "Extra Large Tenant", "cloud": "Azure China (21Vianet)", "description": "Isolated tenant for China data residency; local write, reads from East Asia." },
                        { "id": "global", "name": "Virto Tenant", "cloud": "Microsoft Azure", "description": "Commercial Azure; East US 2 master write with geo-replicated reads." }
                      ],
                      "regions": [
                        { "id": "eastus2", "name": "East US 2", "city": "Virginia · Master Write", "lat": 37.0, "lon": -79.0, "tenantId": "global", "role": "master-write", "master": true, "tzOffset": -4, "weight": 1.0 },
                        { "id": "germany", "name": "Germany West Central", "city": "Frankfurt · Read replica", "lat": 50.1, "lon": 8.7, "tenantId": "global", "role": "read-replica", "master": false, "tzOffset": 2, "weight": 0.66 },
                        { "id": "japan", "name": "Japan East", "city": "Tokyo · Read replica", "lat": 35.7, "lon": 139.7, "tenantId": "global", "role": "read-replica", "master": false, "tzOffset": 9, "weight": 0.58 },
                        { "id": "eastasia", "name": "East Asia", "city": "Hong Kong · Read/cache", "lat": 22.3, "lon": 114.2, "tenantId": "global", "role": "read-cache", "master": false, "tzOffset": 8, "weight": 0.42 },
                        { "id": "china", "name": "China North 3", "city": "21Vianet · Local R/W", "lat": 39.9, "lon": 116.4, "tenantId": "china", "role": "local-rw", "master": false, "tzOffset": 8, "weight": 0.74 }
                      ],
                      "connections": [
                        { "from": "eastus2", "to": "germany", "type": "replication" },
                        { "from": "eastus2", "to": "japan", "type": "replication" },
                        { "from": "eastus2", "to": "eastasia", "type": "replication" },
                        { "from": "germany", "to": "eastus2", "type": "mutation" },
                        { "from": "japan", "to": "eastus2", "type": "mutation" },
                        { "from": "eastasia", "to": "eastus2", "type": "mutation" },
                        { "from": "eastus2", "to": "china", "type": "syncer" },
                        { "from": "eastasia", "to": "china", "type": "replication" }
                      ],
                      "datacenters": [
                        { "id": "westeurope", "name": "West Europe", "lat": 52.37, "lon": 4.90, "current": false },
                        { "id": "eastus", "name": "East US", "lat": 37.37, "lon": -79.82, "current": true },
                        { "id": "westus", "name": "West US", "lat": 37.78, "lon": -122.42, "current": false },
                        { "id": "australiaeast", "name": "Australia East", "lat": -33.87, "lon": 151.21, "current": false },
                        { "id": "japaneast", "name": "Japan East", "lat": 35.7, "lon": 139.7, "current": true },
                        { "id": "chinanorth3", "name": "China North 3", "lat": 39.9, "lon": 116.4, "current": true }
                      ],
                      "metricMax": { "requests": 2400, "users": 12000, "orders": 280, "instances": 18 }
                    }
                    """,
            };

            public static IEnumerable<SettingDescriptor> AllGeneralSettings
            {
                get
                {
                    yield return SolutionArchitectureMapEnabled;
                    yield return CustomizationOverrides;
                    yield return ProjectInfo;
                    yield return Topology;
                }
            }
        }

        public static IEnumerable<SettingDescriptor> AllSettings
        {
            get
            {
                return General.AllGeneralSettings;
            }
        }
    }
}
