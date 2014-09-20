'use strict';
/**
 * @fileOverview The base-resolver/utils module has utility functions for parsing expressions, normalizing dependencies
 * and validations
 * @module base-resolver/utils
 * @requires q
 */
var q = require('q');
/**
 * Extracts arguments from a function and makes a list of dependencies. The function parameter is transformed from
 * camel-case to <code>-</code> and <code>.</code> separated, and an expression is created which evaluates them in
 * sequence, cascading, till a match is found.<br/>
 * eg. <code>databaseMongoLocal</code> as a parameter dependency will try to resolve to
 * <code>databaseMongoLocal</code>. If there are no components with that name, <code>database-mongo-local</code> will
 * be tried. If <code>database-mongo-local</code> is also not resolved, <code>database.mongo.local</code> will be
 * tried. The first resolution will be taken as the value and if none of them resolves, the component will fail to
 * resolve.
 * @param {callback} callback - the function to be inspected
 * @returns {Array.<string>} an array of dependency expressions in the same sequence as the parameters
 * @example
 * utils.getDependencies(function (x, y, z) {
 *      ...
 * });
 * // this will return ['x', 'y', 'z']
 * @example
 * utils.getDependencies(function (dataStore, userProvider) {
 *      ...
 * });
 * // This should return
 * [
 *      'dataStore|data-store|data.store',
 *      'userProvider|user-provider|user.provider'
 * ]
 */
exports.getDependencies = function (callback) {
    // only accept functions as argument
    if (typeof callback !== 'function') {
        throw new Error('only functions can have params!');
    }
    /*jslint regexp: true */
    // first trim off any comments form the string representation of the function
    var args = callback.toString().replace(
        /((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, ''
    ).// then split out the parameters in a ocmma separated string
        match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1];
    /*jslint regexp: false */
    // if there are no parameters, return an empty array
    if (args.length === 0) {
        return [];
    }
    // if there are parameters, make an expression for each of them and return the array of expressions
    return args.split(/,/).map(
        function (dependency) {
            var splits = dependency.match(/[A-Z]?[a-z0-9]*/g).map(
                function (match) {
                    return match.toLowerCase();
                }
            ).slice(0, -1);
            if (splits.length === 1) {
                return dependency;
            }
            return dependency + '|' + splits.join('-') + '|' + splits.join('.');
        }
    );
};
/**
 * Resolves any expression with modifiers. Modifiers are used to add logic to dependency injection. There are 3 kinds
 * of modifiers. They are listed in their order of execution priority below:<br/>
 * <ul><li><b># (parameter modifier)</b> will pass parameters to the component that can be used to construct the
 * options object.</li>
 * <li><b>| (OR modifier)</b> will inject the first resolvable component</li>
 * <li><b>? (optional modifier)</b> will silently pass undefined if resolution fails</li></ul>
 * If the expression is a primitive non string type, it will be returned as-is. All strings will be considered as
 * expressions and resolved. For objects or arrays, resolution will happen recursively.
 * @param {string} expression - the expression to evaluate
 * @param {module:base-resolver/utils~ResolverCallback} resolverFunction - the resolver function to be called.
 * @returns {q} a promise that resolves to the evaluated value of the expression
 * @example
 * utils.resolveExpression('a|b#c|d', function (expression, params, expressionWithParams) {
 *          ...
 * }
 * // the ResolverCallback will be called with these arguments
 * // first call
 *  a, [], a
 * // second call
 *  b, [c], b#c
 * // third call
 *  d, [], d
 * // if any of the calls return a non undefined value or do not throw an Error, the next call will not happen
 * // if none of the callbacks return a defined value, the promise returned will reject with error
 * @example
 * utils.resolveExpression('a|b#c/#c1#c2|d?', function (expression, params, expressionWithParams) {
 *          ...
 * }
 * // the ResolverCallback will be called with these arguments
 * // first call
 *  a, [], a
 * // second call
 *  b, [c#c1, c2], b#c/#c1#c2
 * // third call
 *  d, [], d
 * // #, |, ? and / can be escaped with a / as shown in the second call
 * // if any of the calls return a non undefined value or do not throw an Error, the next call will not happen
 * // if none of the callbacks return a defined value, the promise returned will still resolve with undefined
 * // because theoptional flag (?) is specified
 */
exports.resolveExpression = function (expression, resolverFunction) {
    var optional, expressions, deferred, promise, retVal, getNextPromise;
    if (typeof expression !== 'string') {
        if (typeof expression !== 'object') {
            // if the expression is not a string or an object, we resolve it with its value
            return q(expression);
        }
        // if the expression is not a string and an object, every key has to be resolved recursively
        // make sure you do not modify the original object
        retVal = new expression.constructor();
        return q.all(
            Object.keys(expression).map(
                function (key) {
                    return exports.resolveExpression(expression[key], resolverFunction).then(
                        function (value) {
                            retVal[key] = value;
                        }
                    );
                }
            )
        ).then(
            function () {
                // once all keys are resolved, construct the object and send it accross
                return retVal;
            }
        );
    }
    // for strings, do the following
    deferred = q.defer();
    promise = deferred.promise;
    // check if the parameter is opitonal
    optional = /\?$/.test(expression);
    if (optional) {
        // trim off the trailing ?
        expression = expression.slice(0, -1);
    }
    // split the expression with the OR (|) modifier making sure \ is escaped
    /*jslint regexp: true */
    expressions = expression.match(/(\/.|[^\|])+/g);
    /*jslint regexp: false */
    // try resolving the expressions one by one, breaking at first successful resolution
    getNextPromise = function () {
        /*jslint regexp: true */
        // split the expression to get the parameters
        var thisExpressionWithParams = expressions.shift();
        var thisParams = thisExpressionWithParams.match(/(\/.|[^#])+/g).map(
            function (value) {
                return value.replace(/\/([\/\|\?#]{1})/g, '$1');
            }
        );
        var thisExpression = thisParams.shift();
        /*jslint regexp: false */
        return q.Promise(
            function (resolve) {
                resolve(resolverFunction(thisExpression, thisParams, thisExpressionWithParams));
            }
        ).then(
            function (value) {
                // if resolution returned a value, skip further resolutions and return
                if (value) {
                    return value;
                }
                // otherwise, use the next expression till all expressions are used
                if (expressions.length) {
                    return getNextPromise();
                }
                return undefined;
            }, function () {
                // the error case is handled as an undefined resolution
                // as before, use the next expression till all expressions are used
                if (expressions.length) {
                    return getNextPromise();
                }
                return undefined;
            }
        );
    };
    getNextPromise().then(
        function (value) {
            // once the resolution is recieved, if the resolution is undefined and the resolution is not optional,
            // reject with an error
            if (!value && !optional) {
                return deferred.reject(
                    new Error(
                            'expression could not be resolved to a defined value. Use ? if this is acceptable (in ' +
                            expression + ')'
                    )
                );
            }
            // otherwise, return the resolution
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
    return (Object.prototype.toString.call(obj) === '[object Array]') && (typeof obj[obj.length - 1] === 'function') &&
        (function () {
            var i, j;
            for (i = 0, j = obj.length - 1; i < j; i = i + 1) {
                if (typeof obj[i] !== 'string') {
                    return false;
                }
            }
            return true;
        }());
};
/**
 * This function clones and creates a new copy of the object.
 * @param {*} obj - any object
 * @returns {*} cloned object
 */
exports.clone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};
/**
 * The ResolverCallback is used in {@link module:base-resolver/utils.resolveExpression| resolveExpression} function as
 * a parameter. This callback is called for every part of the expression to get its value. The values are then
 * consolidated and a result is obtained.
 * @callback module:base-resolver/utils~ResolverCallback
 * @param {string} expression - the actual expression on which the resolver is to be called
 * @param {Array.<string>} params - the list of parameters to be sent to the configurations object
 * @param {string} expressionWithParams - the original expression. This can be used for caching results.
 * @see module:base-resolver/utils.resolveExpression
 */
