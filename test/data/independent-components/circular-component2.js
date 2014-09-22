'use strict';
module.exports = [
    'circular-component1',
    function () {
        process.LOG('circular-component2.load');
        return 'circular-component2';
    }
];
module.exports['zest-component'] = 'circular-component2';
