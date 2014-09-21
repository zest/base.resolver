'use strict';
module.exports = ['options', function (option) {
    process.LOG('configurable-component.load');
    process.LOG(option);
    return option;
}];
module.exports['zest-component'] = 'configurable-component';
