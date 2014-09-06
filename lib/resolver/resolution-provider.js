'use strict';
var Q = require('q'),
    utils = require('./utils');
module.exports = function (configurations) {
    var componentsMap = {},
        unloader = require('./unloader')(),
        resolve = function (dependencyExpression) {
            if (componentsMap[dependencyExpression]) {
                return componentsMap[dependencyExpression];
            }
            return utils.resolveExpression(dependencyExpression,
                function () {
                    // arguments will be [ComponentName, param1, param2]
                    var componentName = Array.prototype.slice.call(arguments, 0, 1),
                        optionsResolverMap = (function (paramArray) {
                            var i, j, retVal = {};
                            for (i = 0, j = paramArray.length; i < j; i = i + 1) {
                                retVal['{' + i + '}'] = paramArray[i];
                            }
                            return retVal;
                        }(arguments)),
                        factoryFunction = configurations.get(componentName).factory.slice(-1)[0],
                        dependencies = configurations.get(componentName).factory.slice(0, -1);
                    // resolve the factory method
                    if (dependencies.length === 0) {
                        return factoryFunction.apply({}, []);
                    }
                    return Q.all(dependencies.map(
                        function (dependency) {
                            if (dependency === 'options') {
                                return utils.resolveExpression(configurations.get(componentName).options,
                                    function (value) {
                                        return (optionsResolverMap[value] || value);
                                    });
                            }
                            if (dependency === 'unload') {
                                return unloader.register;
                            }
                            return resolve(dependency);
                        }
                    ).then(
                        function () {
                            return factoryFunction.apply({}, arguments);
                        }
                    ));
                });
        };
    return {
        resolve: resolve
    };
};
