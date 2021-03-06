/* eslint-disable */
const assert = require('assert');
const lightningPool = require('../');
const TestFactory = require('./TestFactory');

describe('Start/Close', function() {
  var pool;

  afterEach(function() {
    pool.close(true);
  });

  it('should start on acquire', function(done) {
    pool = lightningPool.createPool(new TestFactory());
    pool.on('start', function() {
      done();
    });
    pool.acquire(function(err, obj) {
      assert(!err, err);
    });
  });

  it('should not start a closed pool again', function(done) {
    pool = lightningPool.createPool(new TestFactory());
    pool.start();
    pool.close(function() {
      pool.acquire()
          .then(function() {
            assert(0);
          })
          .catch(function(e) {
            return done();
          });
    });
  });

  it('should not acquire from a closed pool', function(done) {
    pool = lightningPool.createPool(new TestFactory());
    pool.start();
    pool.close(function() {
      pool.acquire(function(err) {
        assert(err);
        done();
      });
      assert(0);
    });
  });

});
