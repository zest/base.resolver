'use strict';
var utils = require('../../lib/resolver/utils'),
    Q = require('q'),
    chai = require('chai'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-spies'));
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
            var spy = chai.spy(function () {
                throw new Error();
            });
            return expect(
                utils.resolveExpression(2, spy)
            ).to.eventually.eql(2).then(
                function () {
                    expect(spy).to.have.been.called.exactly(0);
                }
            );
        });
        it('should resolve a single value', function () {
            var spy = chai.spy(function (val) {
                return val;
            });
            return expect(
                utils.resolveExpression('just a string', spy)
            ).to.eventually.equal('just a string').then(
                function () {
                    expect(spy).to.have.been.called.exactly(1);
                    expect(spy).to.have.been.called.with('just a string');
                }
            );
        });
        it('should resolve the OR(|) expressions', function () {
            var spy = chai.spy(function (val) {
                return val;
            });
            return expect(
                utils.resolveExpression('string1|string2', spy)
            ).to.eventually.equal('string1').then(
                function () {
                    expect(spy).to.have.been.called.exactly(1);
                    expect(spy).to.have.been.called.with('string1');
                }
            );
        });
        it('should resolve the OPTIONAL(?) expressions', function () {
            var spy = chai.spy(function () {
                return undefined;
            });
            return expect(
                utils.resolveExpression('string1?', spy)
            ).to.eventually.equal(undefined).then(
                function () {
                    expect(spy).to.have.been.called.exactly(1);
                    expect(spy).to.have.been.called.with('string1');
                }
            );
        });
        it('should throw an error if no value is found', function () {
            var spy = chai.spy(function () {
                return undefined;
            });
            return expect(
                utils.resolveExpression('string1', spy)
            ).to.eventually.be.rejectedWith(Error).then(
                function () {
                    expect(spy).to.have.been.called.exactly(1);
                    expect(spy).to.have.been.called.with('string1');
                }
            );
        });
        it('should get values for compound expressions', function () {
            var spy = chai.spy(function (val) {
                return (isNaN(parseInt(val, 10)) ? val : undefined);
            });
            return expect(
                utils.resolveExpression('1|2|3|non numeric string|5|6', spy)
            ).to.eventually.equal('non numeric string').then(
                function () {
                    expect(spy).to.have.been.called.exactly(4);
                    expect(spy).to.have.been.called.with('1');
                    expect(spy).to.have.been.called.with('2');
                    expect(spy).to.have.been.called.with('3');
                    expect(spy).to.have.been.called.with('non numeric string');
                    expect(spy).to.not.have.been.called.with('5');
                    expect(spy).to.not.have.been.called.with('6');
                }
            );
        });
        it('should escape strings with | properly', function () {
            var spy = chai.spy(function (val) {
                return (isNaN(parseInt(val, 10)) ? val : undefined);
            });
            return expect(
                utils.resolveExpression('1|2|3|non/|numeric/|string|5|6', spy)
            ).to.eventually.equal('non|numeric|string').then(
                function () {
                    expect(spy).to.have.been.called.exactly(4);
                    expect(spy).to.have.been.called.with('1');
                    expect(spy).to.have.been.called.with('2');
                    expect(spy).to.have.been.called.with('3');
                    expect(spy).to.have.been.called.with('non|numeric|string');
                    expect(spy).to.not.have.been.called.with('5');
                    expect(spy).to.not.have.been.called.with('6');
                }
            );
        });
        it('should escape strings with ? properly', function () {
            var spy = chai.spy(function (val) {
                return (isNaN(parseInt(val, 10)) ? val : undefined);
            });
            return expect(
                utils.resolveExpression('1|2|3|non/?numeric/?//string|5|6', spy)
            ).to.eventually.equal('non?numeric?/string').then(
                function () {
                    expect(spy).to.have.been.called.exactly(4);
                    expect(spy).to.have.been.called.with('1');
                    expect(spy).to.have.been.called.with('2');
                    expect(spy).to.have.been.called.with('3');
                    expect(spy).to.have.been.called.with('non?numeric?/string');
                    expect(spy).to.not.have.been.called.with('5');
                    expect(spy).to.not.have.been.called.with('6');
                    // i love u
                }
            );
        });
        it('should work on promises', function () {
            var spy = chai.spy(function (val) {
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
                    expect(spy).to.have.been.called.exactly(4);
                    expect(spy).to.have.been.called.with('1');
                    expect(spy).to.have.been.called.with('2');
                    expect(spy).to.have.been.called.with('3');
                    expect(spy).to.have.been.called.with('non?numeric?/string');
                    expect(spy).to.not.have.been.called.with('ass');
                    expect(spy).to.not.have.been.called.with('6');
                }
            );
        });
        it('should parse objects recursively', function () {
            var spy = chai.spy(function (val) {
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
                    expect(spy).to.have.been.called.exactly(11);
                    expect(spy).to.have.been.called.with('alpha');
                    expect(spy).to.have.been.called.with('beta');
                    expect(spy).to.have.been.called.with('gamma');
                    expect(spy).to.have.been.called.with('theta');
                    expect(spy).to.have.been.called.with('u');
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
            var spy = chai.spy(function (val) {
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
                    expect(spy).to.have.been.called.exactly(4);
                    expect(spy).to.have.been.called.with('1');
                    expect(spy).to.have.been.called.with('2');
                    expect(spy).to.have.been.called.with('3');
                    expect(spy).to.have.been.called.with('non?numeric?/string');
                    expect(spy).to.not.have.been.called.with('ass');
                    expect(spy).to.not.have.been.called.with('6');
                }
            );
        });
        it('should be able to handle errors gracefully', function () {
            var spy = chai.spy(function (val) {
                if (isNaN(parseInt(val, 10))) {
                    return val;
                }
                throw new Error('undefined');
            });
            return expect(
                utils.resolveExpression('1|2|3|non///?numeric/?//string|5|6', spy)
            ).to.eventually.equal('non/?numeric?/string').then(
                function () {
                    expect(spy).to.have.been.called.exactly(4);
                    expect(spy).to.have.been.called.with('1');
                    expect(spy).to.have.been.called.with('2');
                    expect(spy).to.have.been.called.with('3');
                    expect(spy).to.have.been.called.with('non/?numeric?/string');
                    expect(spy).to.not.have.been.called.with('5');
                    expect(spy).to.not.have.been.called.with('6');
                }
            );
        });
        it('should be able to integrate escapes properly', function () {
            var spy = chai.spy(function () {
                if (arguments.length === 1) {
                    return undefined;
                }
                return Array.prototype.slice.call(arguments, 0);
            });
            return expect(
                utils.resolveExpression('1|2|3/#|non///?numeric/?/#///#string#a#b#c/#d|5|6', spy)
            ).to.eventually.eql(
                [
                    'non/?numeric?#/#string',
                    'a',
                    'b',
                    'c#d'
                ]
            ).then(
                function () {
                    expect(spy).to.have.been.called.exactly(4);
                    expect(spy).to.have.been.called.with('1');
                    expect(spy).to.have.been.called.with('2');
                    expect(spy).to.have.been.called.with('3#');
                    expect(spy).to.have.been.called.with('non/?numeric?#/#string', 'a', 'b', 'c#d');
                    expect(spy).to.not.have.been.called.with('5');
                    expect(spy).to.not.have.been.called.with('6');
                }
            );
        });
    });
});
