"use strict";
module.exports = [
    'json-named-component',
    'js-named-component',
    'module-named-component',
    'module-package-json-named-component',
    function (json, js, module, packageModule) {
        process.LOG(json);
        process.LOG(js);
        process.LOG(module);
        process.LOG(packageModule);
        process.LOG('here');
        return 'module-package-json-unnamed-component';
    }
];