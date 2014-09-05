'use strict';
var Q = require('q');
exports.getParams = function (callback) {
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
    (function getNextPromise() {
        return Q.promise(function (resolve) {
            var oneExpression = expressions.shift().replace(/\/([\/\|\?\#]{1})/g, '$1'),
                resolution = resolverFunction(oneExpression);
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