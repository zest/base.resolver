'use strict';
module.exports = ['unload-component1', 'unload', function (component, unload) {
    process.LOG('unload-component2.load');
    unload(function () {
        process.LOG('unload-component2.unload');
    });
    return 'unload-component2';
}];
