'use strict';
module.exports = [
    'circular-component1!',
    function (c1) {
        process.LOG('circular-component2.load');
        c1.promise.then(function (data) {
            process.LOG(data);
        });
        return 'circular-component2';
    }
];
module.exports['zest-component'] = 'circular-component2';
