'use strict';

var ByteBuffer = require("bytebuffer");

/**
 * This function validates if the initiator is User
 * @param {*} ctx Transaction context object
 */
function validateUserInitiator(ctx) {
  if ('usersMSP' !== ctx.clientIdentity.getMSPID())
    throw new Error('Requestor is not allowed to perform this action');
}

/**
 * This function validates if the initiator is Registrar
 * @param {*} ctx Transaction context object
 */
function validateRegistrarInitiator(ctx) {
  if ('registrarMSP' !== ctx.clientIdentity.getMSPID())
    throw new Error('Requestor is not allowed to perform this action');
}

/**
 * This is a common utility method that is used to fetch the result from iterator
 * This is used when we try to fetch information from the ledger based on partial information
 * @param {*} iterator Iterator
 */
async function iterateResult(iterator) {
  let result = await iterator.next();

  while (true) {
    if (result.value && result.value.value) {
      var bb = ByteBuffer.wrap(result.value.value);
      var b = new Buffer(bb.toArrayBuffer());
      return b;
    }
    if (result.done) {
      iterator.close();
      break;
    }
    result = await iterator.next();
  }
}

module.exports = { validateUserInitiator, validateRegistrarInitiator, iterateResult };