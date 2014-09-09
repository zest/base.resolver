'use strict';
// silence the logger
require('base.logger').configure([]);
var resolver = require('../../lib'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
describe('base.resolver (unloader)', function () {
    // it should be able to unload components in the proper sequence
    it('should be able to unload components in the proper sequence', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-unload')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(2);
            expect(loggerSpy.getCall(0)).to.have.been.calledWith('unload-component1.load');
            expect(loggerSpy.getCall(1)).to.have.been.calledWith('unload-component2.load');
            return resolver.unload();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(4);
            expect(loggerSpy.getCall(2)).to.have.been.calledWith('unload-component2.unload');
            expect(loggerSpy.getCall(3)).to.have.been.calledWith('unload-component1.unload');
        });
    });
    // it should be able to unload asynchronous components in the proper sequence
    it('should be able to unload asynchronous components in the proper sequence', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-unload-async')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(2);
            expect(loggerSpy.getCall(0)).to.have.been.calledWith('unload-component1async.load');
            expect(loggerSpy.getCall(1)).to.have.been.calledWith('unload-component2async.load');
            return resolver.unload();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(6);
            expect(loggerSpy.getCall(2)).to.have.been.calledWith('unload-component2async.unload.start');
            expect(loggerSpy.getCall(3)).to.have.been.calledWith('unload-component2async.unload.end');
            expect(loggerSpy.getCall(4)).to.have.been.calledWith('unload-component1async.unload.start');
            expect(loggerSpy.getCall(5)).to.have.been.calledWith('unload-component1async.unload.end');
        });
    });
    // it should be able to unload components even if there is an error
    it('should be able to unload components even if there is an error', function () {
        var loggerSpy = sinon.spy(function (arg) {
            if (arg.indexOf('.unload') !== -1) {
                throw new Error();
            }
        });
        return expect(resolver('./test/data/configs/configuration-unload')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(2);
            expect(loggerSpy.getCall(0)).to.have.been.calledWith('unload-component1.load');
            expect(loggerSpy.getCall(1)).to.have.been.calledWith('unload-component2.load');
            return resolver.unload();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(4);
            expect(loggerSpy.getCall(2)).to.have.been.calledWith('unload-component2.unload');
            expect(loggerSpy.getCall(3)).to.have.been.calledWith('unload-component1.unload');
        });
    });
});
