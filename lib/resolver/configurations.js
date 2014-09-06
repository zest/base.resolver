'use strict';
var Q = require('q'),
    path = require('path'),
    fs = require('fs'),
    stat = Q.nbind(fs.stat, fs);
module.exports = (function () {
    var configurationsMap = {},
        startups = [],
        configurator = {
            setup: function (configArray, baseDir) {
                return Q.allSettled(configArray.map(function (config) {
                    if (typeof config === 'string') {
                        config = {
                            path: config
                        };
                    }
                    var resolvedPath = path.resolve(config.path),
                        normalizedPath = path.normalize(config.path);
                    if (resolvedPath === normalizedPath) {
                        config.path = normalizedPath;
                    } else {
                        config.path = path.join(baseDir, config.path);
                    }
                    config.factory = require(config.path);
                    // try fetching the component name from package.json file
                    return stat(config.path).then(function (stat) {
                        try {
                            if (stat.isDirectory()) {
                                var pName = require(path.join(config.path, 'package.json'))['soul-component'];
                                if (pName) {
                                    return pName;
                                }
                            }
                        } catch (ignore) {
                            // let the exception go unhandled
                        }
                        if (config.factory['soul-component']) {
                            return config.factory['soul-component'];
                        }
                        return 'component-' + parseInt(Math.random() * 9999999999, 10);
                    }, function (error) {
                        // an error will come if the component is a file and it is included without an extension
                        if (config.factory['soul-component']) {
                            return config.factory['soul-component'];
                        }
                        return 'component-' + parseInt(Math.random() * 9999999999, 10);
                    }).then(function (packageName) {
                        configurationsMap[packageName] = config;
                        if (config.startup) {
                            startups.push(packageName);
                        }
                    });
                })).then(function (promises) {
                    return configurator;
                });
            },
            get: function (dependencyExpression) {
                // FIXME
                return configurationsMap[dependencyExpression];
            },
            startupDependencies: function () {
                return startups;
            }
        };
    return configurator;
}());
