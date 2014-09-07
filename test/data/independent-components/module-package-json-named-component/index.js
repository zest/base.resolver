"use strict";
module.exports = function () {
    process.LOG('module-package-json-named-component.load');
    process.LOG(Array.prototype.slice.call(arguments));
    return 'module-package-json-named-component';
};
