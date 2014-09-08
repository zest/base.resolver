'use strict';
var resolver = require('../../lib'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
describe('base.resolver (configuration)', function () {
    // it should return a module
    it('should return a module', function () {
        expect(resolver).not.to.equal(undefined);
    });
    // it should throw an error if configured with a non existant file
    it('should throw an error if configured with a non existant file', function () {
        return expect(resolver('./test/data/configs/non-existant-path')).
            to.eventually.be.rejectedWith(Error);
    });
    // it should reject configurations which have invalid component paths
    it('should reject configurations which have invalid component paths', function () {
        return expect(resolver('./test/data/configs/configuration-invalid-path')).
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
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-nodep')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(2);
            expect(loggerSpy).to.have.been.calledWith('js-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
        });
    });
    // it should configure dependent modules properly
    it('should configure dependent modules properly', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-dependency')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(10);
            // js-unnamed-component load
            expect(loggerSpy).to.have.been.calledWith('js-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            // module-package-json-unnamed-component load
            expect(loggerSpy).to.have.been.calledWith('module-package-json-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([
                {
                    'soul-component': 'json-named-component',
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
        });
    });
    // it should configure dependent modules properly
    it('should configure npm modules and repositories properly without package.json', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-native')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(2);
            expect(loggerSpy).to.have.been.calledWith('js-component-using-native.load');
        });
    });
    // it should configure dependent modules properly
    it('should configure npm modules and repositories properly with package.json', function () {
        var loggerSpy = sinon.spy();
        return expect(resolver('./test/data/configs/configuration-native')).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(2);
            expect(loggerSpy).to.have.been.calledWith('js-component-using-native.load');
        });
    });
    it('should be able to take absolute paths as module paths', function () {
        /*jslint nomen: true */
        var loggerSpy = sinon.spy(),
            dirName = __dirname;
        /*jslint nomen: false */
        return expect(resolver(
            [
                '../independent-components/json-named-component',
                {
                    path: '../independent-components/json-unnamed-component',
                    startup: true
                },
                '../independent-components/js-named-component',
                {
                    path: '../independent-components/js-unnamed-component',
                    startup: true
                },
                dirName + '/../data/independent-components/module-named-component',
                '../independent-components/module-unnamed-component',
                '../independent-components/module-package-json-named-component',
                {
                    path: dirName + '/../data/independent-components/module-package-json-unnamed-component',
                    startup: true
                }
            ],
            dirName + '/../data/configs'
        )).to.eventually.have.keys([
            'load',
            'unload',
            'reload'
        ]).then(function (resolver) {
            process.LOG = loggerSpy;
            return resolver.load();
        }).then(function () {
            expect(loggerSpy).to.have.callCount(10);
            // js-unnamed-component load
            expect(loggerSpy).to.have.been.calledWith('js-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([]);
            // module-package-json-unnamed-component load
            expect(loggerSpy).to.have.been.calledWith('module-package-json-unnamed-component.load');
            expect(loggerSpy).to.have.been.calledWith([
                {
                    'soul-component': 'json-named-component',
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
        });
    });
});
