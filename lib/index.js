'use strict';
/**
 * @fileOverview The base.resolver component provides inversion of control and dependency injection api for running of
 * zest infrastructure components. Using resolver, you set up a simple configuration and tell resolver which components
 * you want to load. Each component registers itself with resolver, so other components can use its functions.
 * Components can be maintained as NPM packages so they can be dropped in to other zest integrations. Simple components
 * can also just be a file that can be required from node. (A javascript file or even a JSON file)
 * @module base-resolver
 * @requires base-resolver/configurations
 * @requires base-resolver/resolution-provider
 * @requires base-resolver/unloader
 * @requires base-resolver/utils
 * @requires {@link external:q}
 * @requires {@link external:base-logger}
 */
var q = require('q');
var path = require('path');
var logger = require('base.logger')('RESOLVER');
var resolverFactory = function (configPathOrArray, basePath) {
    // array of configurations
    var args = [
            configPathOrArray,
            basePath
        ],
        configArray = configPathOrArray,
    // base directory relative to which modules should be resolved
        baseDir,
    // resolver that has load, reload and unload functions
        resolver,
    // configurations is initialized here and sent to resolution-provider
        configurations = require('./resolver/configurations')(),
    // unloader is used to inject unload dependency
        unloader = require('./resolver/unloader')(),
        resolutionProvider = require('./resolver/resolution-provider')(
            configurations, unloader
        );
    /**
     * @description The load function runs all starting components in the configuration, injecting all other
     * dependencies required.
     * @returns {external:q} a Promise that gets resolved with {@link module:base-resolver~Resolver} when the load is
     * executed. This promise is rejected with the error if load execution fails.
     * @memberof module:base-resolver~Resolver
     */
    var load = function () {
        var startupDependencies = configurations.startupDependencies();
        logger.info(startupDependencies.length, 'startup components found. Loading them now.');
        return q.all(
            startupDependencies.map(
                function (dependencyExpression) {
                    return resolutionProvider.resolve(dependencyExpression);
                }
            )
        ).then(
            function () {
                logger.info('all components loaded successfully!');
                return resolver;
            }, function (error) {
                logger.error('error loading startup components!', error);
                throw error;
            }
        );
    };
    /**
     * @description The unload function will call all registered unload handlers and clear off the dependency
     * tree
     * @returns {external:q} a Promise that gets resolved when the unload is executed. This promise is rejected with the
     * error if unload execution fails.
     * @memberof module:base-resolver~Resolver
     */
    var unload = function () {
        logger.info('unloading components.');
        return unloader.unload().then(
            function () {
                logger.info('successfully unloaded all components!');
            }
        );
    };
    /**
     * The resolver object that is used to start or restart zest integration by taking care of inversion of control
     * and dependency injection.
     * @namespace module:base-resolver~Resolver
     */
    resolver = {
        load: load,
        unload: unload,
        /**
         * The reload function will re-configure and start all starting components in the
         * configuration. If a reload is called before the previous reload is over, the previous reload will be
         * interrupted.
         * @returns {external:q} a Promise that gets resolved with {@link module:base-resolver~Resolver} when the
         * reload is executed. This promise is rejected with the error if reload execution fails.
         * @memberof module:base-resolver~Resolver
         */
        reload: function () {
            logger.debug('reloading components.');
            return unload().then(
                function () {
                    return resolverFactory.apply({}, args);
                }
            ).then(
                function (resolver) {
                    return resolver.load();
                }
            );
        }
    };
    logger.info('initializing resolver with configurations.');
    if (basePath) {
        baseDir = path.resolve(basePath);
    }
    if (typeof configPathOrArray === 'string') {
        try {
            configArray = require(configPathOrArray);
            if (!baseDir) {
                baseDir = path.resolve(path.dirname(configPathOrArray));
            }
        } catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                logger.error('cannot parse configuration file.');
                logger.error(error);
                throw error;
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
    logger.debug(baseDir, configArray);
    return configurations.setup(configArray, baseDir).then(
        function () {
            logger.info('initialization successful.');
            return resolver;
        }, function (error) {
            logger.error('error initializing resolver!', error);
            throw error;
        }
    );
};
/**
 * This function configures the resolver. This function takes two parameters and creates a configuration object that is
 * used to load the starting modules.
 * @param {string|Array.<module:base-resolver~Configuration|string>} configPathOrArray - If this parameter is a string,
 * requiring the string path should return the config array. We try to require the <code>configPath</code> directly. If
 * that fails, it is joined with the current working directory of the process for resolution. The config array itself
 * can also be passed instead of passing a <code>configPath</code>. if config array element is a string, it is assumed
 * to be the path of the {@link module:base-resolver~Configuration } object, with all other properties defaulted.
 * @param {string} [basePath] -  basePath is an optional parameter which provides the absolute path from where the
 * components should be resolved. If <code>basePath</code> is not provided, it is resolved as follows:
 * <ul><li>if the first parameter is a <code>configPath</code> string, the <code>basePath</code> is assumed to be the
 * <code>configPath</code></li>
 * <li>if the first parameter is a not a <code>configPath</code> string, the <code>basePath</code> is assumed to be the
 * current working directory for the process</li></ul>
 * @returns {external:q}  a Promise that gets resolved with {@link module:base-resolver~Resolver} when the resolver is
 * set up. This promise is rejected with the error if the resolver set-up fails.
 */
module.exports = function (configPathOrArray, basePath) {
    return q.Promise(
        function (resolve) {
            resolve(resolverFactory(configPathOrArray, basePath));
        }
    );
};
