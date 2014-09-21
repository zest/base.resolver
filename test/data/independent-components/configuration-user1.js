'use strict';
module.exports = ['configurable-component#alpha#beta', function () {
    process.LOG('configuration-user1.load');
    return 'configuration-user1';
}];
module.exports['zest-component'] = 'configuration-user1';
