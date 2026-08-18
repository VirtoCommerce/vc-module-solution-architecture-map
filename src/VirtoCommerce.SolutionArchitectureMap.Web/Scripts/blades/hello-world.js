angular.module('VirtoCommerce.SolutionArchitectureMap')
    .controller('VirtoCommerce.SolutionArchitectureMap.helloWorldController', ['$scope', 'VirtoCommerce.SolutionArchitectureMap.webApi', function ($scope, api) {
        var blade = $scope.blade;
        blade.title = 'Solution Architecture Map';

        blade.refresh = function () {
            api.get(function (data) {
                blade.title = 'solution-architecture-map.blades.hello-world.title';
                blade.data = data.result;
                blade.isLoading = false;
            });
        };

        blade.refresh();
    }]);
