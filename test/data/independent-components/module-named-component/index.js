"use strict";
module.exports = function () {
    process.LOG('module-named-component.load');
    process.LOG(Array.prototype.slice.call(arguments));
    return 'module-named-component';
};
module.exports['soul-component'] = 'module-named-component';
