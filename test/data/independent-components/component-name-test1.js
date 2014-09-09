'use strict';
module.exports = function () {
    process.LOG('component-name-test1.load');
    return 'component-name-test1';
};
module.exports['soul-component'] = 'component-name-test1';
