'use strict';

const Property = require('../models/property');
const { iterateResult } = require('../utils');

class PropertyList {
  constructor(ctx) {
    this.ctx = ctx;
    this.name = 'org.property-registration-network.regnet.lists.property';
  }

  /**
  * Adds a property model to the ledger
  * @param propertyObject {Property}
  * @returns {Promise<Property>}
  */
  async addProperty(propertyObject) {
    const requestCompositeKey = this.ctx.stub.createCompositeKey(this.name, propertyObject.getKeyArray());
    const requestBuffer = propertyObject.toBuffer();
    await this.ctx.stub.putState(requestCompositeKey, requestBuffer);
  }

  /**
   * Deletes the property model from the ledger
   * @param propertyObj
   * @returns {Promise<Property>}
   */
  async deleteProperty(propertyObj) {
    const propertyCompositeKey = this.ctx.stub.createCompositeKey(this.name, propertyObj.getKeyArray());
    await this.ctx.stub.deleteState(propertyCompositeKey);
  }

  /**
   * Returns the Property model stored in ledger identified by this key
   * @param propertyKey
   * @returns {Promise<Property>}
   */
  async getProperty(propertyKey) {
    const propertyCompositeKey = this.ctx.stub.createCompositeKey(this.name, propertyKey.split(':'));
    const propertyBuffer = await this.ctx.stub.getState(propertyCompositeKey);
    return Property.fromBuffer(propertyBuffer);
  }

  /**
   * Returns the Property model stored in blockchain identified by the partial key
   * This is needed because property key contains propertyId, name and aadhar of the owner, but while fetching the details, we send only propertyId
   * @param propertyKey
   * @returns {Promise<Property>}
   */
  async getPropertyByPartialCompositeKey(propertyKey) {
    try {
      const propertyIterator = await this.ctx.stub.getStateByPartialCompositeKey(this.name, propertyKey.split(':'));
      const propertyBuffer = await iterateResult(propertyIterator);

      return Property.fromBuffer(propertyBuffer);
    } catch (err) {
      throw new Error(err);
    }
  }
}

module.exports = PropertyList;
