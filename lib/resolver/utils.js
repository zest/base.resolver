'use strict';
/**
 * @fileOverview The base-resolver/utils module has utility functions for parsing expressions, normalizing dependencies
 * and validations
 * @module base-resolver/utils
 * @requires q
 */
var Q = require('q');
exports.getDependencies = function (callback) {
    if (!(typeof callback === 'function')) {
        throw new Error('only functions can have params!');
    }
    /*jslint regexp: true */
    var args = callback.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, '').
        match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1];
    /*jslint regexp: false */
    if (args.length === 0) {
        return [];
    }
    return args.split(/,/).map(function (dependency) {
        var splits = dependency.match(/[A-Z]?[a-z0-9]*/g).map(
            function (match) {
                return match.toLowerCase();
            }
        ).slice(0, -1);
        if (splits.length === 1) {
            return dependency;
        }
        return dependency + '|' + splits.join('-') + '|' + splits.join('.');
    });
};
exports.resolveExpression = function (expression, resolverFunction) {
    var optional,
        expressions,
        deferred,
        promise,
        retVal,
        getNextPromise;
    if (typeof expression !== 'string') {
        if (typeof expression !== 'object') {
            return Q.Promise(function (resolve) {
                resolve(expression);
            });
        }
        retVal = new expression.constructor();
        return Q.allSettled(
            Object.keys(expression).map(function (key) {
                return exports.resolveExpression(expression[key], resolverFunction).then(function (value) {
                    retVal[key] = value;
                });
            })
        ).then(
            function () {
                return retVal;
            }
        );
    }
    deferred = Q.defer();
    promise = deferred.promise;
    optional = /\?$/.test(expression);
    if (optional) {
        expression = expression.slice(0, -1);
    }
    /*jslint regexp: true */
    expressions = expression.match(/(\/.|[^\|])+/g);
    /*jslint regexp: false */
    getNextPromise = function () {
        return Q.promise(function (resolve) {
            /*jslint regexp: true */
            var thisExpressionWithParams = expressions.shift(),
                thisParams = thisExpressionWithParams.match(/(\/.|[^#])+/g).map(function (value) {
                    return value.replace(/\/([\/\|\?#]{1})/g, '$1');
                }),
                thisExpression = thisParams.shift(),
                resolution = resolverFunction.call({}, thisExpression, thisParams, thisExpressionWithParams);
            /*jslint regexp: false */
            resolve(resolution);
        }).then(
            function (value) {
                if (value) {
                    return value;
                }
                if (expressions.length) {
                    return getNextPromise();
                }
                return undefined;
            },
            function () {
                if (expressions.length) {
                    return getNextPromise();
                }
                return undefined;
            }
        );
    };
    getNextPromise().then(
        function (value) {
            if (!value && !optional) {
                return deferred.reject(
                    new Error('expression could not be resolved to a defined value. Use ? if this is acceptable')
                );
            }
            return deferred.resolve(value);
        }
    );
    return promise;
};
exports.isInjectorArray = function (obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]')
        && (typeof obj[obj.length - 1] === 'function')
        && (function () {
            var i, j;
            for (i = 0, j = obj.length - 1; i < j; i = i + 1) {
                if (typeof obj[i] !== 'string') {
                    return false;
                }
            }
            return true;
        }());
};
