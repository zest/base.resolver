'use strict';
var configurations = require('./configurations'),
    Q = require('q'),
    utils = require('./utils');
module.exports = (function () {
    var params,
        factory,
        componentsMap = {},
        resolve = function (dependencyExpression) {
            var config = configurations.get(dependencyExpression);
            if (componentsMap[dependencyExpression]) {
                return componentsMap[dependencyExpression];
            }
            if (typeof config.factory === 'function') {
                params = utils.getDependencies(config.factory);
                factory = config.factory;
            } else if (utils.isInjectorArray(config.factory)) {
                params = config.factory.slice(0, -1);
                factory = config.factory.slice(-1);
            } else {
                params = [];
                factory = config.factory;
            }
            componentsMap[dependencyExpression] = Q.spread(params.map(function (dependency) {
                return resolve(dependency);
            })).then(function () {
                if (typeof factory !== 'function') {
                    return factory;
                }
                return factory.apply({}, arguments);
            });
            return componentsMap[dependencyExpression];
        };
    return resolve;
}());
