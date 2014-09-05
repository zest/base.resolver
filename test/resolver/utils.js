'use strict';
var utils = require('../../lib/resolver/utils'),
    Q = require('q'),
    chai = require('chai'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-spies'));
describe('base.resolver.utils', function () {
    describe('#getParams', function () {
        it('should get params for a function', function () {
            expect(
                utils.getParams(function (x, y, z) {
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
        it('should return an empty array for a function with no params', function () {
            expect(
                utils.getParams(function () {
                    return;
                })
            ).to.eql([]);
        });
        it('should throw an error if it is not passed a function', function () {
            expect(function () {
                return utils.getParams({});
            }).to.throw(Error);
        });
    });
    describe('#resolveExpression', function () {
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
        it('should resolve or (|) expressions', function () {
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
        it('should resolve optional (?) expressions', function () {
            var spy = chai.spy(function (val) {
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
            var spy = chai.spy(function (val) {
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
                        function (resolve, reject) {
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
                    // i love u
                }
            );
        });
    });
});
