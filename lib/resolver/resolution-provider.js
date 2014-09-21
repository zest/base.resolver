'use strict';
/**
 * @fileOverview The base-resolver/resolution-provider module is used for storing, managing and creating zest
 * components and for injecting them into other components.
 * @module base-resolver/resolution-provider
 * @requires base-resolver/unloader
 * @requires base-resolver/utils
 */
var Q = require('q');
var utils = require('./utils');
var logger = require('base.logger')('RESOLVER/resolution-provider');
/**
 * Resolution provider is used to resolve modules by their names. This module takes
 * {module:base-resolver/configurations~ConfigurationManager} as input.
 * @returns {module:base-resolver/resolution-provider~ResolutionProvider} the resolver with one resolve method
 */
module.exports = function (configurations, unloader) {
    // components map is used to cache components.
    var componentsMap = {}, /**
     * This function resolves an expression and returns a promise that resolves to the corresponding component
     * @param {string} dependencyExpression - the expression to resolve
     * @return {q} a promise that resolves to the corresponding component
     * @memberof module:base-resolver/resolution-provider~ResolutionProvider
     */
    resolve = function (dependencyExpression) {
        logger.log('trying to resolve:', dependencyExpression);
        return utils.resolveExpression(
            dependencyExpression, function (componentName, params, cacheKey) {
                logger.log('\tparsing:', dependencyExpression);
                var componentConfig = configurations.get(componentName);
                var factoryFunction = componentConfig.factory.slice(-1)[0];
                var dependencies = componentConfig.factory.slice(
                    0, -1
                );
                if (!componentsMap[cacheKey]) {
                    componentsMap[cacheKey] = Q.all(
                        dependencies.map(
                            function (dependency) {
                                if (dependency === 'options') {
                                    return utils.resolveExpression(
                                        componentConfig.options, function (value) {
                                            if (/^\{[0-9]+\}$/.test(value)) {
                                                var index = parseInt(value.replace(/\{|\}/g, ''), 10) - 1;
                                                return params[index];
                                            }
                                            return value;
                                        }
                                    );
                                }
                                if (dependency === 'unload') {
                                    return unloader.register;
                                }
                                return resolve(dependency);
                            }
                        )
                    ).then(
                        function (args) {
                            logger.log('resolved:', dependencyExpression);
                            return factoryFunction.apply({}, args);
                        }
                    );
                }
                return componentsMap[cacheKey];
            }
        );
    };
    /**
     * Resolver is returned by {@link module:base-resolver/resolution-provider}
     * @namespace module:base-resolver/resolution-provider~ResolutionProvider
     */
    return {
        resolve: resolve
    };
};
