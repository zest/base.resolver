'use strict';
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
    return args.split(/,/);
};
exports.resolveExpression = function (expression, resolverFunction) {
    if (typeof expression !== 'string') {
        if (typeof expression !== 'object') {
            return Q.Promise(function (resolve) {
                resolve(expression);
            });
        }
        return Q.allSettled(
            Object.keys(expression).map(function (key) {
                return exports.resolveExpression(expression[key], resolverFunction).then(function (value) {
                    expression[key] = value;
                });
            })
        ).then(
            function () {
                return expression;
            }
        );
    }
    var optional,
        expressions,
        deferred = Q.defer(),
        promise = deferred.promise;
    optional = /\?$/.test(expression);
    if (optional) {
        expression = expression.slice(0, -1);
    }
    /*jslint regexp: true */
    expressions = expression.match(/(\/.|[^\|])+/g);
    /*jslint regexp: false */
    (function getNextPromise () {
        return Q.promise(function (resolve) {
            /*jslint regexp: true */
            var oneExpressionWithParams = expressions.shift().match(/(\/.|[^#])+/g).map(function (value) {
                    return value.replace(/\/([\/\|\?#]{1})/g, '$1');
                }),
                resolution = resolverFunction.apply({}, oneExpressionWithParams);
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
    }()).then(
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