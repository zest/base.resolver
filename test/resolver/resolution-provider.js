'use strict';
// silence the logger
require('base.logger').configure([]);
var resolver = require('../../lib'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
describe('base.resolver (resolution-provider)', function () {
    // it should resolve modules only once
    it('should resolve modules only once', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-multiple-injection')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(12);
            // js-unnamed-component load
            expect(loggerSpy).to.have.been.calledWith('js-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            // module-package-json-unnamed-component load
            expect(loggerSpy).to.have.been.calledWith('module-package-json-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([
                {
                    'zest-component': 'json-named-component',
                    name: 'json-named-component'
                },
                'js-named-component',
                'module-named-component',
                'module-package-json-named-component'
            ]);
            // module-package-json-unnamed-component dependencies
            expect(loggerSpy).to.have.been.calledWith('js-named-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            expect(loggerSpy).to.have.been.calledWith('module-named-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            expect(loggerSpy).to.have.been.calledWith('module-package-json-named-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            expect(loggerSpy).to.have.been.calledWith('multiple-module-requires.load');
            expect(loggerSpy).to.have.been.calledWith([
                'js-named-component',
                'module-named-component',
                'module-package-json-named-component'
            ]);
        });
    });
    // it should try degrading to an existing module wherever possible
    it('should try degrading to an existing module wherever possible', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-multiple-degradation')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(12);
            // js-unnamed-component load
            expect(loggerSpy).to.have.been.calledWith('js-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            // module-package-json-unnamed-component load
            expect(loggerSpy).to.have.been.calledWith('module-package-json-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([
                {
                    'zest-component': 'json-named-component',
                    name: 'json-named-component'
                },
                'js-named-component',
                'module-named-component',
                'module-package-json-named-component'
            ]);
            // module-package-json-unnamed-component dependencies
            expect(loggerSpy).to.have.been.calledWith('js-named-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            expect(loggerSpy).to.have.been.calledWith('module-named-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            expect(loggerSpy).to.have.been.calledWith('module-package-json-named-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            expect(loggerSpy).to.have.been.calledWith('multiple-module-requires.load');
            expect(loggerSpy).to.have.been.calledWith([
                undefined,
                'js-named-component',
                'module-named-component',
                'module-package-json-named-component'
            ]);
        });
    });
    // it should throw an error when a module without any replacement doesn't exist
    it('should throw an error when a module without any replacement doesn\'t exist', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-multiple-impossible')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return expect(resolver.load()).to.eventually.be.rejectedWith(Error);
        });
    });
    // it should resolve just enough times for same component with parameterized configurations
    it('should resolve just enough times for same component with parameterized configurations', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-configurable-component')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(7);
            expect(loggerSpy).to.have.been.calledWith('configurable-component.load');
            expect(loggerSpy).to.have.been.calledWith({
                variable1: 'alpha',
                variable2: 'beta'
            });
            expect(loggerSpy).to.have.been.calledWith('configurable-component.load');
            expect(loggerSpy).to.have.been.calledWith({
                variable1: 'alpha',
                variable2: 'alpha'
            });
            expect(loggerSpy).to.have.been.calledWith('configuration-user1.load');
            expect(loggerSpy).to.have.been.calledWith('configuration-user2.load');
            expect(loggerSpy).to.have.been.calledWith('configuration-user3.load');
        });
    });
    // it should throw an error if all required parameters are not passed
    it('should throw an error if all required parameters are not passed', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-configurable-invalid')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return expect(resolver.load()).to.eventually.be.rejectedWith(Error);
        });
    });
    // it should resolve circular dependency when it is expected to be immediate
    it('should resolve circular dependency when it is expected to be immediate', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-circular-deps')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(4);
            expect(loggerSpy.getCall(0)).to.have.been.calledWith('circular-component2.load');
            expect(loggerSpy.getCall(1)).to.have.been.calledWith('circular-component1.load');
            expect(loggerSpy.getCall(2)).to.have.been.calledWith('circular-component2');
            expect(loggerSpy.getCall(3)).to.have.been.calledWith('circular-component1');
        });
    });
});
