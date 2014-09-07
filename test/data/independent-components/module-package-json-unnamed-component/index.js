"use strict";
module.exports = [
    'json-named-component',
    'js-named-component',
    'module-named-component',
    'module-package-json-named-component',
    function (jsonModule, jsModule, namedModule, packageModule) {
        process.LOG('module-package-json-unnamed-component.load');
        process.LOG(Array.prototype.slice.call(arguments));
        return 'module-package-json-unnamed-component';
    }
];
