'use strict';
/**
 * @fileOverview The base-resolver/configurations module is used for storing, managing and getting resolver
 * configurations. The configurations are passed to the resolver during its construction, either as an array, or as a
 * path, requiring which would return an array. If a path is provided, the configuration array is retrieved by the
 * {@link module:base-resolver} before feeding to this module.
 * @module base-resolver/configurations
 * @requires base-resolver/utils
 */
var Q = require('q');
var path = require('path');
var fs = require('fs');
var utils = require('./utils');
var stat = Q.denodeify(fs.stat);
var writeFile = Q.denodeify(fs.writeFile);
var logger = require('base.logger')('RESOLVER/configurations');
/**
 * Creates a ConfigurationManager and returns it
 * @returns {module:base-resolver/configurations~ConfigurationManager} the configuration manager for managing
 * configuration
 */
module.exports = function () {
    var configurationsMap = {}, startups = [], /**
     * A configurations manager manages the lifecycle of one configuration array for dependency injection in
     * resolver.
     * @namespace module:base-resolver/configurations~ConfigurationManager
     */
    configurator = {
        /**
         * The setup function configures the ConfigurationManager with an Array of
         * {@link module:base-resolver~Configuration} objects.
         * @param {Array.<module:base-resolver~Configuration|string>} configArray - the array of configurations to
         * use
         * @param {string} baseDir - the directory relative to which the component paths should be resolved.
         * @returns {q} a Promise that gets resolved with this
         * {@link base-resolver/configurations~ConfigurationManager} when the setup is complete. This promise is
         * rejected with the error if reload execution fails.
         * @memberof module:base-resolver/configurations~ConfigurationManager
         * @see module:base-resolver~Configuration
         */
        setup: function (configArray, baseDir) {
            // create a clone of the config array for use. Since, the configuration is not read but required. There
            // will otherwise be only one global copy which anyone could change
            configArray = utils.clone(configArray);
            return Q.all(
                configArray.map(
                    function (config) {
                        // normalize the configuration so that all of them follow the same syntax
                        if (typeof config === 'string') {
                            config = {
                                path: config
                            };
                        }
                        return Q.Promise(
                            function (resolve, reject) {
                                // first get the absolute module path
                                var resolvedPath, normalizedPath, npmInstall;
                                if (config.path.indexOf('.') === 0 || config.path.split(/\//).length > 2) {
                                    // if the path is relative and in the local drive, just make the path absolute
                                    logger.log('fetching component from relative path:', config.path);
                                    resolvedPath = path.resolve(config.path);
                                    normalizedPath = path.normalize(config.path);
                                    if (resolvedPath === normalizedPath) {
                                        // if the path is absolute, we just keep it as is
                                        config.path = normalizedPath;
                                    } else {
                                        // if the path is relative, we make it absolute.
                                        config.path = path.join(baseDir, config.path);
                                    }
                                    return resolve(config.path);
                                }
                                // if path does not start with a ., or contains only one / the component is assumed to
                                // be an npm module or git repo which can be fetched using npm install
                                logger.log('fetching component using npm install:', config.path);
                                logger.log('installing at path:', baseDir);
                                // first check if there is a package.json file in the baseDir
                                Q.Promise(
                                    function (resolve) {
                                        fs.exists(path.join(baseDir, 'package.json'), resolve);
                                    }
                                ).then(
                                    function (exists) {
                                        if (exists) {
                                            return true;
                                        }
                                        // if the file is not there, we create it
                                        return writeFile(
                                            path.join(baseDir, 'package.json'),
                                            JSON.stringify({
                                                name: 'integration-' + parseInt(Math.random() * 9999999999, 10)
                                            })
                                        );
                                    }
                                ).then(
                                    function () {
                                        // once the package.json file is ensured, install the dependencies
                                        npmInstall = require('child_process').exec(
                                                'npm install ' + config.path, {
                                                cwd: baseDir
                                            }
                                        );
                                        npmInstall.stdout.on(
                                            'data', function (data) {
                                                logger.log(data);
                                            }
                                        );
                                        npmInstall.stderr.on(
                                            'data', function (data) {
                                                logger.warn(data);
                                            }
                                        );
                                        npmInstall.on(
                                            'close', function (code) {
                                                if (code === 0) {
                                                    logger.log('installed', config.path, '...');
                                                    config.path = path.join(
                                                        baseDir, 'node_modules', config.path.split(/\//).pop()
                                                    );
                                                    logger.log('\t at', config.path);
                                                    resolve(config.path);
                                                } else {
                                                    logger.error('npm install exited with code', code);
                                                    reject(new Error('npm install exited with code ' + code));
                                                }
                                            }
                                        );
                                        npmInstall.on(
                                            'error', function (err) {
                                                logger.error('npm install failed with error:', err);
                                                reject(err);
                                            }
                                        );
                                    }
                                );
                            }
                        ).then(
                            function () {
                                // then we normalize the factory function
                                var factoryFunction, componentObject;
                                logger.log('normalizing the factory functions for:', config.path, '...');
                                config.factory = require(config.path);
                                //noinspection JSHint
                                if (config.native) {
                                    // if the node module is native, just return it from the factory function
                                    logger.log('\tfactory is a native component.');
                                    componentObject = config.factory;
                                    config.factory = [
                                        function () {
                                            return componentObject;
                                        }
                                    ];
                                    config.factory['zest-component'] = componentObject['zest-component'];
                                } else if (typeof config.factory === 'function') {
                                    // if factory is a normal function, change it to an injector array
                                    logger.log('\tfactory is a normal function.');
                                    factoryFunction = config.factory;
                                    config.factory = utils.getDependencies(factoryFunction);
                                    logger.log('\tdependencies:', config.factory);
                                    config.factory.push(factoryFunction);
                                    config.factory['zest-component'] = factoryFunction['zest-component'];
                                } else if (!utils.isInjectorArray(config.factory)) {
                                    // if component returns an object, return it from the factory function
                                    logger.log('\tfactory is an object.');
                                    componentObject = config.factory;
                                    config.factory = [
                                        function () {
                                            return componentObject;
                                        }
                                    ];
                                    config.factory['zest-component'] = componentObject['zest-component'];
                                } else {
                                    // if component is an injector array, don't do anything
                                    logger.log('\tfactory is an injector array. No normalization required.');
                                    logger.log('\tdependencies:', config.factory.slice(0, -1).join(', '));
                                }
                            }
                        ).then(
                            function () {
                                // we get the path details to figure if it is a file or directory
                                return stat(config.path).then(
                                    function (stats) {
                                        return stats;
                                    }, function () {
                                        // an error will come if the component is a file and it is included without an
                                        // extension
                                        return undefined;
                                    }
                                );
                            }
                        ).then(
                            function (stat) {
                                var packageDetails;
                                if (stat && stat.isDirectory()) {
                                    try {
                                        // if the path is a directory, try to find the package.json file in the
                                        // directory
                                        packageDetails = require(path.join(config.path, 'package.json'));
                                        // if zest-component is present in package.json, use it
                                        if (packageDetails['zest-component']) {
                                            return packageDetails['zest-component'];
                                        }
                                        // if the component is native, use the name specified in package.json
                                        if (config.native && packageDetails.name) {
                                            return packageDetails.name;
                                        }
                                    } catch (ignore) {
                                        // do nothing here
                                    }
                                }
                                // if name cannot be found in package.json, check if the factory has zest-component
                                // property
                                if (config.factory['zest-component']) {
                                    return config.factory['zest-component'];
                                }
                                // if the component is native and name cannot be retrieved from package.json, pick the
                                // base name form the path and use it
                                if (config.native) {
                                    return path.basename(config.path, path.extname(config.path));
                                }
                                // if all attempts to find a component name fails, create one!
                                return 'component-' + parseInt(Math.random() * 9999999999, 10);
                            }
                        ).then(
                            function (packageName) {
                                // finally set the package configuration
                                logger.log('resolved package name:', packageName);
                                logger.log('\tfor', config.path);
                                configurationsMap[packageName] = config;
                                if (config.startup) {
                                    // if we have a startup component, add its name in the startup list
                                    startups.push(packageName);
                                }
                            }
                        );
                        // if we have a startup component, add its name in the startup list
                    }
                )
            ).then(
                function () {
                    // finally return the configurator object
                    return configurator;
                }
            );
        },
        /**
         * This function gets the configuration corresponding to a dependency name
         * @param {string} dependencyName - the dependency name for which we need the configuration
         * @returns {*} the configuration object corresponding to the dependnecyName
         * @memberof module:base-resolver/configurations~ConfigurationManager
         * @see module:base-resolver~Configuration
         */
        get: function (dependencyName) {
            logger.log('fetching configuration for:', dependencyName);
            return configurationsMap[dependencyName];
        },
        /**
         * The function lists all startup dependencies for the module.
         * @returns {Array.<string>} list of dependency names to be resolved
         * @memberof module:base-resolver/configurations~ConfigurationManager
         * @see module:base-resolver~Configuration
         */
        startupDependencies: function () {
            logger.log('fetching startup dependencies...');
            logger.log('\tfound:', startups);
            return startups;
        }
    };
    return configurator;
};
