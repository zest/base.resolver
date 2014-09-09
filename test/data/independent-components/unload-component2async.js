'use strict';
module.exports = ['q', 'unload-component1async', 'unload', function (q, component, unload) {
    process.LOG('unload-component2async.load');
    unload(function () {
        return q.Promise(function (resolve) {
            process.LOG('unload-component2async.unload.start');
            setTimeout(function () {
                process.LOG('unload-component2async.unload.end');
                resolve();
            }, 100);
        });
    });
    return 'unload-component2async';
}];
