'use strict';
module.exports = ['configurable-component#alpha#beta', 'configuration-user1', function () {
    process.LOG('configuration-user2.load');
    return 'configuration-user2';
}];
module.exports['soul-component'] = 'configuration-user2';
