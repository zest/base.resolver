'use strict';
module.exports = [
    'component-name-test1',
    'component-name-test2',
    'component-name-test3',
    'component-name-test4?',
    function (t1, t2, t3, t4) {
        var t2ret = t2(),
            t3ret = t3();
        process.LOG(t1, t2ret, t3ret, t4);
        process.LOG('component-name-testall.load');
        return true;
    }
];
