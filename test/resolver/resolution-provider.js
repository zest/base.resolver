'use strict';
var resolver = require('../../lib'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = require('chai').expect;
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
describe('base.resolver (resolution-provider)', function () {
    it('should resolve modules only once');
    it('should try degrading to an existing module wherever possible');
    it('should throw an error when a module without any replacement doesn\'t exist');
    it('should resolve multiple times for same component with parameterized configurations');
    it('should resolve only once for same component with same configurations');
});
