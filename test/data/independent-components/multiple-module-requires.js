'use strict';
module.exports = [
    'js-named-component',
    'module-named-component',
    'module-package-json-named-component',
    function (jsModule, namedModule, packageModule) {
        process.LOG('multiple-module-requires.load');
        process.LOG([jsModule, namedModule, packageModule]);
        return 'multiple-module-requires';
    }
];
