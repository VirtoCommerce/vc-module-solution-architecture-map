angular.module('VirtoCommerce.SolutionArchitectureMap')
    .factory('VirtoCommerce.SolutionArchitectureMap.webApi', ['$resource', function ($resource) {
        return $resource('api/solution-architecture-map');
    }]);
