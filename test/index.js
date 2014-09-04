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
            resolver('./test/data/configs/non-existant-path');
        }).to.throw(Error);
    });
    // it should configure properly with an existing file
    it('should configure properly with an existing file', function () {
        expect(this.resolver('./test/data/configs/configuration-empty-array')).to.have.keys([
            'load',
            'unload',
            'reload'
        ]);
    });
    // it should not configure properly with a non array
    it('should not configure properly with a non array', function () {
        var resolver = this.resolver;
        expect(function () {
            return resolver('./test/data/configs/configuration-object');
        }).to.throw(Error);
    });
});
