'use strict';
module.exports = function () {
    process.LOG('js-unnamed-component.load');
    process.LOG(Array.prototype.slice.call(arguments));
    return 'js-unnamed-component';
};
