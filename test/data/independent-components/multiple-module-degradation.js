'use strict';
module.exports = [
    'not-a-valid-module?',
    'js-named-component',
    'not-a-valid-module|module-named-component',
    'module-package-json-named-component',
    function (invalid, jsModule, namedModule, packageModule) {
        process.LOG('multiple-module-requires.load');
        process.LOG([invalid, jsModule, namedModule, packageModule]);
        return 'multiple-module-requires';
    }
];
