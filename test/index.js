'use strict';
var expect = require('chai').expect;
describe('base.resolver', function () {
    beforeEach(function () {
        this.resolver = require('../lib');
    });
    // it should return a module
    it('should return a module', function () {
        expect(this.resolver).not.to.equal(undefined);
    });
    // it should throw an error if configured with a non existant file
    it('should throw an error if configured with a non existant file', function () {
        var resolver = this.resolver;
        expect(function () {
            resolver.config('./test/data/configs/non-existant-path');
        }).to.throw(Error);
    });
    // it should configure properly with an existing file
    it('should configure properly with an existing file', function () {
        var resolver = this.resolver.config('./test/data/configs/configuration-empty-array');
        expect(resolver).to.equal(this.resolver);
        expect(this.resolver).to.have.keys(['config', 'start', 'restart']);
    });
    // it should not configure properly with a non array
    it('should not configure properly with a non array', function () {
        var resolver = this.resolver;
        expect(function () {
            resolver.config('./test/data/configs/configuration-object');
        }).to.throw(Error);
    });
});
