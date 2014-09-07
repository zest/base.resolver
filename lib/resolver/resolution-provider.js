'use strict';
var Q = require('q'),
    utils = require('./utils');
module.exports = function (configurations) {
    var componentsMap = {},
        unloader = require('./unloader')(),
        resolve = function (dependencyExpression) {
            return utils.resolveExpression(dependencyExpression,
                function (componentName, params, cacheKey) {
                    var factoryFunction = configurations.get(componentName).factory.slice(-1)[0],
                        dependencies = configurations.get(componentName).factory.slice(0, -1);
                    if (!componentsMap[cacheKey]) {
                        componentsMap[cacheKey] = Q.all(dependencies.map(
                            function (dependency) {
                                if (dependency === 'options') {
                                    return utils.resolveExpression(configurations.get(componentName).options,
                                        function (value) {
                                            if (/^\{[0-9]+\}$/.test(value)) {
                                                var index = parseInt(value.replace(/\{|\}/g, ''), 10) - 1;
                                                return params[index];
                                            }
                                            return value;
                                        });
                                }
                                if (dependency === 'unload') {
                                    return unloader.register;
                                }
                                return resolve(dependency);
                            }
                        )).then(
                            function (args) {
                                return factoryFunction.apply({}, args);
                            }
                        );
                    }
                    return componentsMap[cacheKey];
                });
        };
    return {
        resolve: resolve
    };
};
