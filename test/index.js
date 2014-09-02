'use strict';
var resolver = require('../lib'),
    expect = require('chai').expect;
describe('base.resolver', function () {
    // it should return a module
    it('it should return a module', function () {
        expect(resolver).not.to.equal(undefined);
    });
});
