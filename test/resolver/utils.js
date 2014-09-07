'use strict';
var utils = require('../../lib/resolver/utils'),
    Q = require('q'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
describe('base.resolver.utils', function () {
    describe('#isInjectorArray', function () {
        it('should be able to identify an injector array', function () {
            expect(
                utils.isInjectorArray([
                    function () {
                        return;
                    }
                ])
            ).to.eql(true);
            expect(
                utils.isInjectorArray([
                    'a',
                    'b',
                    function () {
                        return;
                    }
                ])
            ).to.eql(true);
        });
        it('shoul be able to identify arrays that are not injectors', function () {
            expect(
                utils.isInjectorArray([
                    'a',
                    'b'
                ])
            ).to.eql(false);
            expect(
                utils.isInjectorArray([
                    'a',
                    {},
                    function () {
                        return;
                    }
                ])
            ).to.eql(false);
            expect(
                utils.isInjectorArray([
                    'a',
                    [],
                    function () {
                        return;
                    }
                ])
            ).to.eql(false);
            expect(
                utils.isInjectorArray([
                    'a',
                    function () {
                        return;
                    },
                    'b'
                ])
            ).to.eql(false);
        });
        it('should be able to identify objects as not injectors', function () {
            expect(
                utils.isInjectorArray({})
            ).to.eql(false);
            expect(
                utils.isInjectorArray(2)
            ).to.eql(false);
        });
    });
    describe('#getDependencies', function () {
        it('should get params for a function', function () {
            expect(
                utils.getDependencies(function (x, y, z) {
                    return (x + y + z);
                })
            ).to.eql(
                [
                    'x',
                    'y',
                    'z'
                ]
            );
        });
        it('should respect the resolution sequence for camel cased names', function () {
            expect(
                utils.getDependencies(function (aliBabaChalis, aAAA, z) {
                    return;
                })
            ).to.eql(
                [
                    'aliBabaChalis|ali-baba-chalis|ali.baba.chalis',
                    'aAAA|a-a-a-a|a.a.a.a',
                    'z'
                ]
            );
        });
        it('should return an empty array for a function with no params', function () {
            expect(
                utils.getDependencies(function () {
                    return;
                })
            ).to.eql([]);
        });
        it('should throw an error if it is not passed a function', function () {
            expect(function () {
                return utils.getDependencies({});
            }).to.throw(Error);
        });
    });
    describe('#resolveExpression', function () {
        it('should return a non string primitive value as is', function () {
            var spy = sinon.spy(function () {
                throw new Error();
            });
            return expect(
                utils.resolveExpression(2, spy)
            ).to.eventually.eql(2).then(
                function () {
                    expect(spy).to.have.callCount(0);
                }
            );
        });
        it('should resolve a single value', function () {
            var spy = sinon.spy(function (value, params, expression) {
                return expression;
            });
            return expect(
                utils.resolveExpression('just a string', spy)
            ).to.eventually.equal('just a string').then(
                function () {
                    expect(spy).to.have.callCount(1);
                    expect(spy).to.have.been.calledWith('just a string', [], 'just a string');
                }
            );
        });
        it('should resolve the OR(|) expressions', function () {
            var spy = sinon.spy(function (value, params, expression) {
                return expression;
            });
            return expect(
                utils.resolveExpression('string1|string2', spy)
            ).to.eventually.equal('string1').then(
                function () {
                    expect(spy).to.have.callCount(1);
                    expect(spy).to.have.been.calledWith('string1', [], 'string1');
                }
            );
        });
        it('should resolve the OPTIONAL(?) expressions', function () {
            var spy = sinon.spy(function (value, params, expression) {
                return undefined;
            });
            return expect(
                utils.resolveExpression('string1?', spy)
            ).to.eventually.equal(undefined).then(
                function () {
                    expect(spy).to.have.callCount(1);
                    expect(spy).to.have.been.calledWith('string1');
                }
            );
        });
        it('should throw an error if no value is found', function () {
            var spy = sinon.spy(function () {
                return undefined;
            });
            return expect(
                utils.resolveExpression('string1', spy)
            ).to.eventually.be.rejectedWith(Error).then(
                function () {
                    expect(spy).to.have.callCount(1);
                    expect(spy).to.have.been.calledWith('string1');
                }
            );
        });
        it('should get values for compound expressions', function () {
            var spy = sinon.spy(function (val) {
                return (isNaN(parseInt(val, 10)) ? val : undefined);
            });
            return expect(
                utils.resolveExpression('1|2|3|non numeric string|5|6', spy)
            ).to.eventually.equal('non numeric string').then(
                function () {
                    expect(spy).to.have.callCount(4);
                    expect(spy).to.have.been.calledWith('1');
                    expect(spy).to.have.been.calledWith('2');
                    expect(spy).to.have.been.calledWith('3');
                    expect(spy).to.have.been.calledWith('non numeric string');
                    expect(spy).to.not.have.been.calledWith('5');
                    expect(spy).to.not.have.been.calledWith('6');
                }
            );
        });
        it('should escape strings with | properly', function () {
            var spy = sinon.spy(function (val) {
                return (isNaN(parseInt(val, 10)) ? val : undefined);
            });
            return expect(
                utils.resolveExpression('1|2|3|non/|numeric/|string|5|6', spy)
            ).to.eventually.equal('non|numeric|string').then(
                function () {
                    expect(spy).to.have.callCount(4);
                    expect(spy).to.have.been.calledWith('1');
                    expect(spy).to.have.been.calledWith('2');
                    expect(spy).to.have.been.calledWith('3');
                    expect(spy).to.have.been.calledWith('non|numeric|string');
                    expect(spy).to.not.have.been.calledWith('5');
                    expect(spy).to.not.have.been.calledWith('6');
                }
            );
        });
        it('should escape strings with ? properly', function () {
            var spy = sinon.spy(function (val) {
                return (isNaN(parseInt(val, 10)) ? val : undefined);
            });
            return expect(
                utils.resolveExpression('1|2|3|non/?numeric/?//string|5|6', spy)
            ).to.eventually.equal('non?numeric?/string').then(
                function () {
                    expect(spy).to.have.callCount(4);
                    expect(spy).to.have.been.calledWith('1');
                    expect(spy).to.have.been.calledWith('2');
                    expect(spy).to.have.been.calledWith('3');
                    expect(spy).to.have.been.calledWith('non?numeric?/string');
                    expect(spy).to.not.have.been.calledWith('5');
                    expect(spy).to.not.have.been.calledWith('6');
                    // i love u
                }
            );
        });
        it('should work on promises', function () {
            var spy = sinon.spy(function (val) {
                return (isNaN(parseInt(val, 10)) ? val : undefined);
            });
            return expect(
                utils.resolveExpression('1|2|3|non/?numeric/?//string|ass|6', function (val) {
                    return Q.Promise(
                        function (resolve) {
                            setTimeout(function () {
                                resolve(spy(val));
                            }, 300);
                        }
                    );
                })
            ).to.eventually.equal('non?numeric?/string').then(
                function () {
                    expect(spy).to.have.callCount(4);
                    expect(spy).to.have.been.calledWith('1');
                    expect(spy).to.have.been.calledWith('2');
                    expect(spy).to.have.been.calledWith('3');
                    expect(spy).to.have.been.calledWith('non?numeric?/string');
                    expect(spy).to.not.have.been.calledWith('ass');
                    expect(spy).to.not.have.been.calledWith('6');
                }
            );
        });
        it('should parse objects recursively', function () {
            var spy = sinon.spy(function (val) {
                if (val !== 'u') {
                    return val;
                }
                return;
            }), obj = {
                alpha: "alpha",
                beta: "u|beta|u",
                gamma: [
                    "u|gamma|u",
                    "u|u|theta|u",
                    "u|u|u?"
                ]
            };
            return expect(
                utils.resolveExpression(obj, spy)
            ).to.eventually.eql(
                {
                    alpha: "alpha",
                    beta: "beta",
                    gamma: [
                        "gamma",
                        "theta",
                        undefined
                    ]
                }
            ).then(
                function () {
                    expect(spy).to.have.callCount(11);
                    expect(spy).to.have.been.calledWith('alpha');
                    expect(spy).to.have.been.calledWith('beta');
                    expect(spy).to.have.been.calledWith('gamma');
                    expect(spy).to.have.been.calledWith('theta');
                    expect(spy).to.have.been.calledWith('u');
                    expect(obj).to.eql({
                        alpha: "alpha",
                        beta: "u|beta|u",
                        gamma: [
                            "u|gamma|u",
                            "u|u|theta|u",
                            "u|u|u?"
                        ]
                    });
                }
            );
        });
        it('should be able to handle rejections', function () {
            var spy = sinon.spy(function (val) {
                return (isNaN(parseInt(val, 10)) ? val : undefined);
            });
            return expect(
                utils.resolveExpression('1|2|3|non/?numeric/?//string|ass|6', function (val) {
                    return Q.Promise(
                        function (resolve, reject) {
                            setTimeout(function () {
                                var newVal = spy(val);
                                if (newVal) {
                                    resolve(newVal);
                                } else {
                                    reject(new Error('undefined'));
                                }
                            }, 300);
                        }
                    );
                })
            ).to.eventually.equal('non?numeric?/string').then(
                function () {
                    expect(spy).to.have.callCount(4);
                    expect(spy).to.have.been.calledWith('1');
                    expect(spy).to.have.been.calledWith('2');
                    expect(spy).to.have.been.calledWith('3');
                    expect(spy).to.have.been.calledWith('non?numeric?/string');
                    expect(spy).to.not.have.been.calledWith('ass');
                    expect(spy).to.not.have.been.calledWith('6');
                }
            );
        });
        it('should be able to handle errors gracefully', function () {
            var spy = sinon.spy(function (val) {
                if (isNaN(parseInt(val, 10))) {
                    return val;
                }
                throw new Error('undefined');
            });
            return expect(
                utils.resolveExpression('1|2|3|non///?numeric/?//string|5|6', spy)
            ).to.eventually.equal('non/?numeric?/string').then(
                function () {
                    expect(spy).to.have.callCount(4);
                    expect(spy).to.have.been.calledWith('1');
                    expect(spy).to.have.been.calledWith('2');
                    expect(spy).to.have.been.calledWith('3');
                    expect(spy).to.have.been.calledWith('non/?numeric?/string');
                    expect(spy).to.not.have.been.calledWith('5');
                    expect(spy).to.not.have.been.calledWith('6');
                }
            );
        });
        it('should be able to integrate escapes properly', function () {
            var spy = sinon.spy(function (value, params) {
                if (params.length === 0) {
                    return undefined;
                }
                return params;
            });
            return expect(
                utils.resolveExpression('1|2|3/#|non///?numeric/?/#///#string#a#b#c/#d|5|6', spy)
            ).to.eventually.eql(
                [
                    'a',
                    'b',
                    'c#d'
                ]
            ).then(
                function () {
                    expect(spy).to.have.callCount(4);
                    expect(spy).to.have.been.calledWith('1', [], '1');
                    expect(spy).to.have.been.calledWith('2', [], '2');
                    expect(spy).to.have.been.calledWith('3#', [], '3/#');
                    expect(spy).to.have.been.calledWith(
                        'non/?numeric?#/#string',
                        ['a', 'b', 'c#d'],
                        'non///?numeric/?/#///#string#a#b#c/#d'
                    );
                    expect(spy).to.not.have.been.calledWith('5');
                    expect(spy).to.not.have.been.calledWith('6');
                }
            );
        });
    });
});
