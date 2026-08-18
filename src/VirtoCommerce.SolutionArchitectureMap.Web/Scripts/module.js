// Call this to register your module to main application
var moduleName = 'VirtoCommerce.SolutionArchitectureMap';

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('workspace.SolutionArchitectureMapState', {
                    url: '/solution-architecture-map',
                    templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
                    controller: [
                        'platformWebApp.bladeNavigationService',
                        function (bladeNavigationService) {
                            var newBlade = {
                                id: 'blade1',
                                controller: 'VirtoCommerce.SolutionArchitectureMap.helloWorldController',
                                template: 'Modules/$(VirtoCommerce.SolutionArchitectureMap)/Scripts/blades/hello-world.html',
                                isClosingDisabled: true,
                            };
                            bladeNavigationService.showBlade(newBlade);
                        }
                    ]
                });
        }
    ])
    .run(['platformWebApp.mainMenuService', '$state',
        function (mainMenuService, $state) {
            //Register module in main menu
            var menuItem = {
                path: 'browse/solution-architecture-map',
                icon: 'fa fa-cube',
                title: 'Solution Architecture Map',
                priority: 100,
                action: function () { $state.go('workspace.SolutionArchitectureMapState'); },
                permission: 'solution-architecture-map:access',
            };
            mainMenuService.addMenuItem(menuItem);
        }
    ]);
