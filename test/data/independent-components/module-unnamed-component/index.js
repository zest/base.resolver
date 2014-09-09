'use strict';
module.exports = function () {
    process.LOG('module-unnamed-component.load');
    process.LOG(Array.prototype.slice.call(arguments));
    return 'module-unnamed-component';
};
