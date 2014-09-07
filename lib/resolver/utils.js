'use strict';
/**
 * @fileOverview The base-resolver/utils module has utility functions for parsing expressions, normalizing dependencies
 * and validations
 * @module base-resolver/utils
 * @requires q
 */
var Q = require('q');
/**
 * Extracts arguments from a function and makes a list of dependencies. The function parameter is transformed from
 * camel-case to <code>-</code> and <code>.</code> separated, and an expression is created which evaluates them in
 * sequence, cascading, till a match is found.<br/>
 * eg. <code>databaseMongoLocal</code> as a parameter dependency will try to resolve to
 * <code>databaseMongoLocal</code>. If there are no components with that name, <code>database-mongo-local</code> will
 * be tried. If <code>database-mongo-local</code> is also not resolved, <code>database.mongo.local</code> will be
 * tried. The first resolution will be taken as the value and if none of them resolves, the component will fail to
 * resolve. Below are some example usages</br>
 * <pre>
 * utils.getDependencies(function (x, y, z) {
 *      ...
 * });
 * // this will return ['x', 'y', 'z']
 *
 * utils.getDependencies(function (dataStore, userProvider) {
 *      ...
 * });
 * // This should return
 * [
 *      'dataStore|data-store|data.store',
 *      'userProvider|user-provider|user.provider'
 * ]
 * </pre>
 * @param {callback} callback - the function to be inspected
 * @returns {Array.<string>} an array of dependency expressions in the same sequence as the parameters
 */
exports.getDependencies = function (callback) {
    // only accept functions as argument
    if (!(typeof callback === 'function')) {
        throw new Error('only functions can have params!');
    }
    /*jslint regexp: true */
    // first trim off any comments form the string representation of the function
    var args = callback.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, '').
    // then split out the parameters in a ocmma separated string
        match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1];
    /*jslint regexp: false */
    // if there are no parameters, return an empty array
    if (args.length === 0) {
        return [];
    }
    // if there are parameters, make an expression for each of them and return the array of expressions
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
/**
 * Resolves any expression with modifiers. Modifiers are used to add logic to dependency injection. There are 3 kinds
 * of modifiers. They are listed in their order of execution priority below:<br/>
 * <ul><li><b># (parameter modifier)</b> will pass parameters to the component that can be used to construct the
 * options object.</li>
 * <li><b>| (OR modifier)</b> will inject the first resolvable component</li>
 * <li><b>? (optional modifier)</b> will silently pass undefined if resolution fails</li></ul>
 * @param {string} expression - the expression to evaluate
 * @param {callback} resolverFunction - the resolver function to be called.
 * @returns {q} a promise that resolves to the evaluated value of the expression
 */
 // FIXME: detail the usage
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
/**
 * This function checks if an array is an injector array or not. An injector array is a valid form of SOUL component
 * representation which is an array with the last element of type function and other elements of type string.
 * The strings in the array is mapped to components and are injected as parameters to the function in the same
 * sequence.
 * @param {*} obj - any object
 * @returns {boolean} true if the object is an injector array. false otherwise.
 */
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
