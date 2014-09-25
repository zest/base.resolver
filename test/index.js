'use strict';
// silence the logger
require('base.logger').stop();
var resolver = require('../lib'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
describe('base.resolver', function () {
    // it should be able to unload and reload components in the proper sequence
    it('should be able to unload and reload components in the proper sequence', function () {
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
            return resolver.reload();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(6);
            expect(loggerSpy.getCall(2)).to.have.been.calledWith('unload-component2.unload');
            expect(loggerSpy.getCall(3)).to.have.been.calledWith('unload-component1.unload');
            expect(loggerSpy.getCall(4)).to.have.been.calledWith('unload-component1.load');
            expect(loggerSpy.getCall(5)).to.have.been.calledWith('unload-component2.load');
            return resolver.reload();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(10);
            expect(loggerSpy.getCall(6)).to.have.been.calledWith('unload-component2.unload');
            expect(loggerSpy.getCall(7)).to.have.been.calledWith('unload-component1.unload');
            expect(loggerSpy.getCall(8)).to.have.been.calledWith('unload-component1.load');
            expect(loggerSpy.getCall(9)).to.have.been.calledWith('unload-component2.load');
        });
    });
    // it should be able to unload and reload asynchronous components in the proper sequence
    it('should be able to unload and reload asynchronous components in the proper sequence', function () {
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
            return resolver.reload();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(8);
            expect(loggerSpy.getCall(2)).to.have.been.calledWith('unload-component2async.unload.start');
            expect(loggerSpy.getCall(3)).to.have.been.calledWith('unload-component2async.unload.end');
            expect(loggerSpy.getCall(4)).to.have.been.calledWith('unload-component1async.unload.start');
            expect(loggerSpy.getCall(5)).to.have.been.calledWith('unload-component1async.unload.end');
            expect(loggerSpy.getCall(6)).to.have.been.calledWith('unload-component1async.load');
            expect(loggerSpy.getCall(7)).to.have.been.calledWith('unload-component2async.load');
            return resolver.reload();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(14);
            expect(loggerSpy.getCall(8)).to.have.been.calledWith('unload-component2async.unload.start');
            expect(loggerSpy.getCall(9)).to.have.been.calledWith('unload-component2async.unload.end');
            expect(loggerSpy.getCall(10)).to.have.been.calledWith('unload-component1async.unload.start');
            expect(loggerSpy.getCall(11)).to.have.been.calledWith('unload-component1async.unload.end');
            expect(loggerSpy.getCall(12)).to.have.been.calledWith('unload-component1async.load');
            expect(loggerSpy.getCall(13)).to.have.been.calledWith('unload-component2async.load');
        });
    });
});
