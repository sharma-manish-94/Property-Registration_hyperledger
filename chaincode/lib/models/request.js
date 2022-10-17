'use strict';

class Request {
  /**
    * Constructor function
    * @param requestObject
    */
  constructor(requestObject) {
    // Dynamically generate key based on propertyId peresnt in the object. 
    const keyArr = requestObject.propertyId ?
      [requestObject.propertyId, requestObject.name, requestObject.aadharNumber] : [requestObject.name, requestObject.aadharNumber];

    this.key = Request.createKey(keyArr);
    Object.assign(this, requestObject);
  }

   /**
   * Get class of this model
   * @returns {string}
   */
    static getClass() {
      return "org.property-registration-network.regnet.models.request";
    }

  /**
    * Create a new instance of this model
    * @returns {Request}
    * @param requestObj {Object}
    */
  static createInstance(requestObj) {
    return new Request(requestObj);
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
    return new Request(json);
  }
}

module.exports = Request;