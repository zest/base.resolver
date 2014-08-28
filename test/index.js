'use strict';
var resolver = require('./injector')();
describe('base.resolver', function () {
    // it should return a module
    it('it should return a module', function () {
        expect(resolver).not.toBe(undefined);
    });
});
