'use strict';
var Q = require('q'),
    path = require('path'),
    normalizer = require('./normalizer'),
    unloader = require('./unloader'),
    resolver = require('./resolver');
module.exports = function (configPathOrArray, basePath) {
    // array of configurations
    var configArray,
    // map of configurations
        configMap = {},
    // base directory relative to which modules should be resolved
        baseDir,
        resolve = function (componentName) {
            var normalizedName = normalizer.normalizeName(componentName),
                options = normalizer.normalizeOptions(configMap[normalizedName].options, componentName);
            return resolver.resolve(componentName, configMap[normalizedName].path, options, unloader.register);
        },
        load = function () {
            return Q.allSettled(
                configArray.filter(function (config) {
                    return config.startup;
                }).map(function (config) {
                    resolve(config.componentName);
                })
            ).then(
                function () {
                    return resolver;
                }
            );
        },
        unload = function () {
            return unloader.unload().then(function () {
                return resolver;
            });
        },
        resolver = {
            load: load,
            unload: unload,
            reload: function () {
                return unload().then(load);
            }
        };
    if (basePath) {
        baseDir = basePath;
    }
    if (typeof configPathOrArray === 'string') {
        try {
            configArray = require(configPathOrArray);
            if (!baseDir) {
                baseDir = path.dirname(configPathOrArray);
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
    if (!configArray instanceof Array) {
        throw new Error('Resolver can only be configured with an array. Check your configuration');
    }
    if (!baseDir) {
        /*jslint nomen: true */
        baseDir = __dirname;
        /*jslint nomen: false */
    }
    configArray = configArray.map(function (item) {
        if (typeof item === 'string') {
            return {
                path: item
            };
        }
        return item;
    }).map(function (item) {
        item.path = path.join(baseDir, item.path);
        item.componentName = normalizer.getNameFromPath(item.path);
        return item;
    });
    configArray.forEach(function (item) {
        configMap[item.componentName] = item;
    });
    return resolver;
};
