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

            public static IEnumerable<SettingDescriptor> AllGeneralSettings
            {
                get
                {
                    yield return SolutionArchitectureMapEnabled;
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
