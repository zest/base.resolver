'use strict';
module.exports = function (componentName, componentPath, options, unload) {
    console.log(componentName, componentPath, options, unload);
    return true;
};