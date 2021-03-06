/* lightning-pool
 ------------------------
 (c) 2017-present Panates
 This file may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/lightning-pool/
 */

const Pool = require('./lib/Pool');
const AbortError = require('./lib/AbortError');

module.exports = {
  createPool: function(factory, options) {
    return new Pool(factory, options);
  },
  Pool: Pool,
  PoolState: Pool.PoolState,
  AbortError
};
