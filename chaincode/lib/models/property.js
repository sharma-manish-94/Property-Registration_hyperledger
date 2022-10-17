'use strict';


class Property {
  /**`
    * Constructor function
    * @param propertyObject
    */
  constructor(propertyObject) {
    this.key = Property.createKey([propertyObject.propertyId, propertyObject.name, propertyObject.aadharNumber]);
    Object.assign(this, propertyObject);
  }

  /**
   * Get class of this model
   * @returns {string}
   */
  static getClass() {
    return "org.property-registration-network.regnet.models.property";
  }

  /**
    * Create a new instance of this model
    * @returns {Property}
    * @param propertyObj {Object}
    */
  static createInstance(propertyObj) {
    return new Property(propertyObj);
  }

   /**
   * Create a key string joined from different key parts
   * @param keyParts {Array}
   * @returns {*}
   */
    static createKey(keyParts) {
      return keyParts.map((part) => JSON.stringify(part)).join(":");
    }
  

  /**
   * Create an array of key parts for this model instance
   * @returns {Array}
   */
  getKeyArray() {
    return this.key.split(":");
  }

  /**
   * Convert the object of this model to a buffer stream
   * @returns {Buffer}
   */
  toBuffer() {
    return Buffer.from(JSON.stringify(this));
  }

  /**
   * Convert the buffer stream received from blockchain into an object of this model
   * @param buffer {Buffer}
   */
  static fromBuffer(buffer) {
    const json = JSON.parse(buffer.toString());
    return new Property(json);
  }
}

module.exports = Property;