'use strict';
module.exports = [
    'circular-component2',
    function (c2) {
        process.LOG('circular-component1.load');
        process.LOG(c2);
        return 'circular-component1';
    }
];
module.exports['zest-component'] = 'circular-component1';