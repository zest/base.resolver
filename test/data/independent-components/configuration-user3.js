'use strict';
module.exports = ['configurable-component#alpha', 'configuration-user1', function () {
    process.LOG('configuration-user3.load');
    return 'configuration-user3';
}];
module.exports['soul-component'] = 'configuration-user3';
