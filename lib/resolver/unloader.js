'use strict';
/**
 * @fileOverview The base-resolver/unloader module is used for registering unloaders. This module is responsible for
 * invoking all handlers registered to unload dependency and executing them in the proper sequence on unload.
 * @module base-resolver/unloader
 * @requires q
 */
var Q = require('q'),
    logger = require('base.logger')('RESOLVER/unloader');
module.exports = function () {
    var unloaders = [];
    return {
        register: function (callback) {
            logger.log('registering unloader');
            unloaders.push(callback);
        },
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
