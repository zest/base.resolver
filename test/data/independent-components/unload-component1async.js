'use strict';
module.exports = ['q', 'unload', function (q, unload) {
    process.LOG('unload-component1async.load');
    unload(function () {
        return q.Promise(function (resolve) {
            process.LOG('unload-component1async.unload.start');
            setTimeout(function () {
                process.LOG('unload-component1async.unload.end');
                resolve();
            }, 100);
        });
    });

    return 'unload-component1';
}];
module.exports['soul-component'] = 'unload-component1async';
