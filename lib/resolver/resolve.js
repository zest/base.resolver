'use strict';
var configurations = require('./configurations'),
    Q = require('q'),
    utils = require('./utils'),
    unloader = require('./unloader');
module.exports = (function () {
    var componentsMap = {},
        resolve = function (dependencyExpression) {
            if (componentsMap[dependencyExpression]) {
                return componentsMap[dependencyExpression];
            }
            return utils.resolveExpression(dependencyExpression,
                function () {
                    var config,
                        dependencies,
                        componentName,
                        optionsResolverMap = {},
                        i,
                        j;
                    for (i = 0, j = arguments.length; i < j; i = i + 1) {
                        optionsResolverMap['{' + i + '}'] = arguments[i];
                    }
                    dependencies = Array.prototype.slice.call(arguments, 0, -1);
                    componentName = Array.prototype.slice.call(arguments, -1);
                    config = configurations.get(componentName);
                    // resolve the factory method
                    return Q.all(dependencies.map(
                        function (dependency) {
                            if (dependency === 'options') {
                                return utils.resolveExpression(config.options, function (value) {
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
                            return config.factory.apply({}, arguments);
                        }
                    ));
                });
        };
    return resolve;
}());
