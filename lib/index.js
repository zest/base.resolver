'use strict';
var Q = require('q'),
    path = require('path'),
    resolverFactory = function (configPathOrArray, basePath) {
        // array of configurations
        var configArray,
        // base directory relative to which modules should be resolved
            baseDir,
        // resolver that has load, reload and unload functions
            resolver,
            configurations = require('./resolver/configurations')(),
            resolutionProvider = require('./resolver/resolution-provider')(configurations),
            load = function () {
                return Q.allSettled(
                    configurations.startupDependencies().map(function (dependencyExpression) {
                        return resolutionProvider.resolve(dependencyExpression);
                    })
                ).then(
                    function () {
                        return resolver;
                    }
                );
            },
            unload = function () {
                return resolver.unload().then(function () {
                    return resolver;
                });
            };
        resolver = {
            load: load,
            unload: unload,
            reload: function () {
                return unload().then(load);
            }
        };
        if (basePath) {
            baseDir = path.resolve(basePath);
        }
        if (typeof configPathOrArray === 'string') {
            try {
                configArray = require(configPathOrArray);
                if (!baseDir) {
                    baseDir = path.resolve(path.dirname(configPathOrArray));
                }
            } catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    throw e;
                }
                configPathOrArray = path.join(process.cwd(), configPathOrArray);
                configArray = require(configPathOrArray);
                if (!baseDir) {
                    baseDir = path.dirname(configPathOrArray);
                }
            }
        }
        if (!(configArray instanceof Array)) {
            throw new Error('Resolver can only be configured with an array. Check your configuration');
        }
        if (!baseDir) {
            /*jslint nomen: true */
            baseDir = __dirname;
            /*jslint nomen: false */
        }
        return configurations.setup(configArray, baseDir).then(
            function () {
                return resolver;
            }
        );
    };
module.exports = function (configPathOrArray, basePath) {
    try {
        return resolverFactory(configPathOrArray, basePath);
    } catch (e) {
        return Q.Promise(function (resolve, reject) {
            reject(e);
        });
    }
};
