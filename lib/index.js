'use strict';
/**
 * @fileOverview The base.resolver component provides inversion of control and dependency injection api for running of
 * SOUL infrastructure components. Using resolver, you set up a simple configuration and tell resolver which components
 * you want to load. Each component registers itself with resolver, so other components can use its functions.
 * Components can be maintained as NPM packages so they can be dropped in to other soul integrations. Simple components
 * can also just be a file that can be required from node. (A javascript file or even a JSON file)
 * @module base-resolver
 * @requires base-resolver/configurations
 * @requires base-resolver/resolution-provider
 * @requires base-resolver/unloader
 * @requires base-resolver/utils
 * @requires q
 */
var Q = require('q'),
    path = require('path'),
    logger = require('base.logger')('RESOLVER'),
    resolverFactory = function (configPathOrArray, basePath) {
        var args = [configPathOrArray, basePath],
            // array of configurations
            configArray = configPathOrArray,
            // base directory relative to which modules should be resolved
            baseDir,
            // resolver that has load, reload and unload functions
            resolver,
            // configurations is initialized here and sent to resolution-provider
            configurations = require('./resolver/configurations')(),
            // unloader is used to inject unload dependency
            unloader = require('./resolver/unloader')(),
            resolutionProvider = require('./resolver/resolution-provider')(configurations, unloader),
            /**
             * @description The load function runs all starting components in the configuration, injecting all other
             * dependencies required.
             * @returns {q} a Promise that gets resolved with {@link module:base-resolver~Resolver} when the load is
             * executed. This promise is rejected with the error if load execution fails.
             * @memberof module:base-resolver~Resolver
             */
            load = function () {
                var startupDependencies = configurations.startupDependencies();
                logger.info(startupDependencies.length, 'startup components found. Loading them now.');
                return Q.all(
                    startupDependencies.map(function (dependencyExpression) {
                        return resolutionProvider.resolve(dependencyExpression);
                    })
                ).then(
                    function () {
                        logger.info('all components loaded successfully!');
                        return resolver;
                    },
                    function (error) {
                        logger.error('error loading startup components!', error);
                        throw error;
                    }
                );
            },
            /**
             * @description The unload function will call all registered unload handlers and clear off the dependency
             * tree
             * @returns {q} a Promise that gets resolved when the unload is executed. This promise is rejected with the
             * error if unload execution fails.
             * @memberof module:base-resolver~Resolver
             */
            unload = function () {
                logger.info('unloading components.');
                return unloader.unload().then(
                    function () {
                        logger.info('successfully unloaded all components!');
                    }
                );
            };
        /**
         * The resolver object that is used to start or restart SOUL integration by taking care of inversion of control
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
             * @returns {q} a Promise that gets resolved with {@link module:base-resolver~Resolver} when the reload is
             * executed. This promise is rejected with the error if reload execution fails.
             * @memberof module:base-resolver~Resolver
             */
            reload: function () {
                logger.log('reloading components.');
                return unload().then(function () {
                    return resolverFactory.apply({}, args);
                }).then(function (resolver) {
                    return resolver.load();
                });
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
            } catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    // not covered by tests
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
        logger.log(baseDir, configArray);
        return configurations.setup(configArray, baseDir).then(
            function () {
                logger.info('initialization successful.');
                return resolver;
            },
            function (error) {
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
 * @returns {q}  a Promise that gets resolved with {@link module:base-resolver~Resolver} when the resolver is set up.
 * This promise is rejected with the error if the resolver set-up fails.
 */
module.exports = function (configPathOrArray, basePath) {
    return Q.fcall(resolverFactory, configPathOrArray, basePath);
};
// documenting the Configuration object
/**
 * An array of Configuration object is passed to configure resolver
 * @typedef {object} module:base-resolver~Configuration
 * @property {string} path - specifies the path of the component
 * <ul><li>if path does not start with a <code>.</code>, or does not contain <code>/</code> the component is assumed to
 * be an npm module</li>
 * <li>if path does not start with a <code>.</code>, and has a single <code>/</code>, the component is assumed to be a
 * git repository</li>
 * <li>in all other cases, the component is assumed to be located at the path specified in the local disk.</li></ul>
 * @property {*} [options] - the options to be passed to instantiate the component.
 * <ul><li>The Parameter Modifier can be used here using the <code>{param-number}</code> format</li>
 * <li>The <code>|</code> (OR modifier) can also be used to gracefully degrade to defaults (explained in the example
 * below)</li>
 * <li>If <code>#</code>, <code>|</code> or <code>/</code> are to be used as literals in option, they must be escaped
 * by a <code>/</code>. Eg. <code>/#</code> will translate to a single <code>#</code></li></ul>
 * @property {boolean} [startup] - startup is optional and is used to specify if a component is a starting component.
 * @property {boolean} [native] - is optional and is used to mark a component as native nodejs module.
 * <ul><li>Native modules are nodejs modules that are not compliant to the SOUL component structure</li>
 * <li>When a component is marked as native, no dependency will be injected in it</li>
 * <li>A native component can be injected into another component by its module name (as specified in
 * <code>package.json</code> file</li>
 * <li>If no <code>package.json</code> file is found, or if no name is there in <code>package.json</code>, the native
 * component will be named as the last part of the path in configuration excluding extension.</li></ul>
 */

