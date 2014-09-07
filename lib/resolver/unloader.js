'use strict';
/**
 * @fileOverview The base-resolver/unloader module is used for registering unloaders. This module is responsible for
 * invoking all handlers registered to unload dependency and executing them in the proper sequence on unload.
 * @module base-resolver/unloader
 * @requires q
 */
var Q = require('q'),
    logger = require('base.logger')('RESOLVER/unloader');
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
            logger.log('registering unloader');
            unloaders.push(callback);
        },
        /**
         * This function is called when the resolver is unloaded.
         * @return {q} a promise that resolves when all callbacks registeres are executed.
         * @memberof module:base-resolver/unloader~Unloader
         */
        unload: function () {
            logger.log('executing unloaders...');
            var retVal = Q.Promise(function (resolve) {
                    return resolve();
                }),
                callSeq = function () {
                    return unloaders.pop().call();
                };
            while (unloaders.length) {
                retVal = retVal.then(callSeq);
            }
            return retVal.then(function () {
                logger.log('All registered unloaders executed successfully.');
            });
        }
    };
};
