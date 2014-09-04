'use strict';
var Q = require('q'),
    path = require('path');
module.exports = (function () {
    var configArray, baseDir,
        resolveRecursively = function (config) {
            return;
        };
    return {
        config: function (configPathOrArray, basePath) {
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
                    var configPath = path.join(process.cwd(), configPathOrArray);
                    configPathOrArray = require(configPath);
                    if (!baseDir) {
                        baseDir = path.dirname(configPath);
                    }
                }
            }
            if (configPathOrArray instanceof Array) {
                configArray = configPathOrArray;
            } else {
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
            });
            return this;
        },
        start: function () {
            return Q.allSettled(
                configArray.filter(function (config) {
                    return config.startup;
                }).map(function (config) {
                    resolveRecursively(config);
                })
            );
        },
        restart: function () {
            return;
        }
    };
}());
