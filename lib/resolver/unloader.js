'use strict';
/**
 * @fileOverview The base-resolver/unloader module is used for registering unloaders. This module is responsible for
 * invoking all handlers registered to unload dependency and executing them in the proper sequence on unload.
 * @module base-resolver/unloader
 * @requires {@link external:q}
 * @requires {@link external:base-logger}
 */
var q = require('q');
var logger = require('base.logger')('RESOLVER/unloader');
/**
 * This function creates a new Unloader and returns it.
 * @returns {module:base-resolver/unloader~Unloader} the resolver with one resolve method
 */
module.exports = function () {
    var unloaders = [];
    /**
     * Unloader is returned by {@link module:base-resolver/unloader}
     * @namespace module:base-resolver/unloader~Unloader
     */
    return {
        /**
         * This function is used to register a callback function to the unloader. We inject this function as a
         * dependency when unloader is requested by a component.
         * @param {callback} callback - the function to execute when resolver is unloaded.
         * @memberof module:base-resolver/unloader~Unloader
         */
        register: function (callback) {
            logger.debug('registering unloader');
            unloaders.push(callback);
        },
        /**
         * This function is called when the resolver is unloaded.
         * @return {external:q} a promise that resolves when all callbacks registeres are executed.
         * @memberof module:base-resolver/unloader~Unloader
         */
        unload: function () {
            var retVal = q(true);
            var eatError = function (unloaderFn) {
                return function (error) {
                    logger.error('error while unloading...');
                    logger.error(error);
                    return unloaderFn();
                };
            };
            var unloaderFn;
            logger.debug('executing unloaders...');
            while (unloaders.length) {
                unloaderFn = unloaders.pop();
                retVal = retVal.then(unloaderFn, eatError(unloaderFn));
            }
            return retVal.then(
                function () {
                    logger.debug('All registered unloaders executed successfully.');
                }, eatError(
                    function () {
                        return;
                    }
                )
            );
        }
    };
};
