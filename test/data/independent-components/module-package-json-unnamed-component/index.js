"use strict";
module.exports = [
    'json-named-component',
    'js-named-component',
    'module-named-component',
    'module-package-json-named-component',
    function (json, js, module, packageModule) {
        console.dir(json);
        console.dir(js);
        console.dir(module);
        console.dir(packageModule);
        console.log('here');
        return 'module-package-json-unnamed-component';
    }
];