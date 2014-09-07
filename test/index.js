'use strict';
var resolver = require('../lib'),
    chai = require('chai'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-spies'));
describe('base.resolver', function () {
    // it should return a module
    it('should return a module', function () {
        expect(resolver).not.to.equal(undefined);
    });
    // it should throw an error if configured with a non existant file
    it('should throw an error if configured with a non existant file', function () {
        return expect(resolver('./test/data/configs/non-existant-path')).
            to.eventually.be.rejectedWith(Error);
    });
    // it should configure properly with an existing file
    it('should configure properly with an existing file', function () {
        return expect(resolver('./test/data/configs/configuration-empty-array')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]);
    });
    // it should not configure properly with a non array
    it('should not configure properly with a non array', function () {
        return expect(resolver('./test/data/configs/configuration-object')).to.eventually.be.rejectedWith(Error);
    });
    // it should configure independent modules properly
    it('should configure independent modules properly', function () {
        var loggerSpy = chai.spy(function () {
            console.log.apply(console, arguments);
        });
        return expect(resolver('./test/data/configs/configuration-nodep')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.been.called.exactly(1);
            expect(loggerSpy).to.have.been.called.with('js-unnamed-component');
        });
    });
    // it should configure dependent modules properly
    it('should configure dependent modules properly', function () {
        var loggerSpy = chai.spy(function () {
            console.log.apply(console, arguments);
        });
        return expect(resolver('./test/data/configs/configuration-dependency')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.been.called.exactly(1);
            expect(loggerSpy).to.have.been.called.with('js-unnamed-component');
        });
    });
});
