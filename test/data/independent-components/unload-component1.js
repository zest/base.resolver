'use strict';
module.exports = ['unload', function (unload) {
    process.LOG('unload-component1.load');
    unload(function () {
        process.LOG('unload-component1.unload');
    });
    return 'unload-component1';
}];
module.exports['zest-component'] = 'unload-component1';
