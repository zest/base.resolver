'use strict';
var Q = require('q');
module.exports = function () {
    var unloaders = [];
    return {
        register: function (callback) {
            unloaders.push(callback);
        },
        unload: function () {
            var retVal = Q.Promise(function (resolve) {
                    return resolve();
                }),
                callSeq = function () {
                    return unloaders.pop().call();
                };
            while (unloaders.length) {
                retVal = retVal.then(callSeq);
            }
            return retVal;
        }
    };
};
