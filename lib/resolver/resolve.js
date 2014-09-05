'use strict';
var configurations = require('./configurations');
var resolve = function (dependencyExpression) {
    var config = configurations.get(dependencyExpression);
    if (typeof config.factory === 'function') {
        console.log('dependency function takes', config.factory.length, 'arguments');
    }
};

module.exports = resolve;
