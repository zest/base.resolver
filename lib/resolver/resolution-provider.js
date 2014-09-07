'use strict';
/**
 * @fileOverview The base-resolver/resolution-provider module is used for storing, managing and creating soul
 * components and for injecting them into other components.
 * @module base-resolver/resolution-provider
 * @requires base-resolver/unloader
 * @requires base-resolver/utils
 */
var Q = require('q'),
    utils = require('./utils'),
    logger = require('base.logger')('RESOLVER/resolution-provider');
module.exports = function (configurations) {
    var componentsMap = {},
        unloader = require('./unloader')(),
        resolve = function (dependencyExpression) {
            logger.log('trying to resolve:', dependencyExpression);
            return utils.resolveExpression(dependencyExpression,
                function (componentName, params, cacheKey) {
                    logger.log('\tparsing:', dependencyExpression);
                    var componentConfig = configurations.get(componentName),
                        factoryFunction = componentConfig.factory.slice(-1)[0],
                        dependencies = componentConfig.factory.slice(0, -1);
                    if (!componentsMap[cacheKey]) {
                        componentsMap[cacheKey] = Q.all(dependencies.map(
                            function (dependency) {
                                if (dependency === 'options') {
                                    return utils.resolveExpression(componentConfig.options,
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
