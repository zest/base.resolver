"use strict";
module.exports = function () {
    process.LOG('js-named-component.load');
    process.LOG(Array.prototype.slice.call(arguments));
    return 'js-named-component';
};
module.exports['soul-component'] = 'js-named-component';
