'use strict';
var resolver = require('../../lib'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
describe('base.resolver (unloader)', function () {
    it('should be able to unload components in the proper sequence', function () {
        var loggerSpy = sinon.spy(function () {
            console.log.apply(console, arguments);
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
            expect(loggerSpy).to.have.been.calledWith('unload-component1.load');
            expect(loggerSpy).to.have.been.calledWith('unload-component2.load');
            return resolver.unload();
        }).then(function (resolver) {
            expect(loggerSpy).to.have.callCount(4);
            expect(loggerSpy).to.have.been.calledWith('unload-component2.unload');
            expect(loggerSpy).to.have.been.calledWith('unload-component1.unload');
        });
    });
});
