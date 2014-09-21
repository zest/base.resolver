'use strict';
module.exports = ['configurable-component', 'configuration-user1', function () {
    process.LOG('configuration-user3.load');
    return 'configuration-user3';
}];
module.exports['zest-component'] = 'configuration-user3';
