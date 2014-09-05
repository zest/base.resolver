'use strict';
var utils = require('../../lib/resolver/utils'),
    expect = require('chai').expect;
describe('base.resolver.utils', function () {
    describe('#getParams', function () {
        it('should get params for a function', function () {
            expect(
                utils.getParams(function (x, y, z) {
                    return;
                })
            ).to.eql(['x', 'y', 'z']);
        });
    });
});
