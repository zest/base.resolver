'use strict';
exports.getParams = function (callback) {
    /*jslint regexp: true */
    var args = callback.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, '').
        match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].split(/,/);
    /*jslint regexp: false */
    return args;
};
