'use strict';
module.exports = ['base.logger', 'q', function (baseLogger, q) {
    process.LOG('js-component-using-native.load');
    process.LOG([
        baseLogger,
        q
    ]);
    return 'js-component-using-native';
}];
