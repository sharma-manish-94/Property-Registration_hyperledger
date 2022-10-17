"use strict";

const { Contract, Context } = require("fabric-contract-api");
const Request = require("./lib/models/request");
const User = require("./lib/models/user");
const Property = require("./lib/models/property");
const RequestList = require("./lib/lists/request-list");
const UserList = require("./lib/lists/user-list");
const PropertyList = require("./lib/lists/property-list");
const { validateUserInitiator } = require("./lib/utils");

class PropertyNetworkContext extends Context {
  constructor() {
    super();
    // Add various model lists to the context class object
    this.requestList = new RequestList(this);
    this.userList = new UserList(this);
    this.propertyList = new PropertyList(this);
  }
}

class UserContract extends Contract {
  constructor() {
    // Provide a custom name to refer to this smart contract
    super("org.property-registration-network.regnet.user");
  }

  // Built in method used to build and return the context for this smart contract on every transaction invoke
  createContext() {
    return new PropertyNetworkContext();
  }

  // A basic user defined function used at the time of instantiating the smart contract
  // to print the success message on console

  async instantiate(ctx) {
    console.log("User Smart Contract Instantiated");
  }

  /**
   * Create a new User Request
   * @param ctx - The transaction context object
   * @param name - Name of the user
   * @param emailId - Email ID of the user
   * @param phoneNumber - Phone Number of the user
   * @param aadharNumber - Aadhar Number of the user
   * @returns {Object}
   */
  async requestNewUser(ctx, name, emailId, phoneNumber, aadharNumber) {
    // check if initiator is a user
    validateUserInitiator(ctx);

    // Validate if the request already exists
    const userRequestKey = Request.createKey([name, aadharNumber]);
    const existingUserRequest = await ctx.requestList
      .getUserRequest(userRequestKey)
      .catch(() =>
        console.log(
          "User`s request doesn`t exists. Creating new user request record ..."
        )
      );

    if (existingUserRequest)
      throw new Error(
        "Failed to create request for this user as this user`s request already exists"
      );

    const userObject = {
      name,
      emailId,
      phoneNumber,
      aadharNumber: aadharNumber,
      createdAt: ctx.stub.getTxTimestamp(),
    };

    // Create a new instance of request model and save it to ledger
    const newUserRequestObject = Request.createInstance(userObject);
    await ctx.requestList.addUserRequest(newUserRequestObject);
    return newUserRequestObject;
  }

  /**
   * Recharge user account
   * @param ctx - The transaction context object
   * @param name - Name of the user
   * @param aadharNumber - Aadhar Number of the user
   * @param txnId - Bank transaction id
   * @returns {Object}
   */
  async rechargeAccount(ctx, name, aadharNumber, txnId) {
    validateUserInitiator(ctx);

    const userKey = Request.createKey([name, aadharNumber]);
    let rechargeAmmount;

    // Validate whether user is registered
    const existingUserObject = await ctx.userList.getUser(userKey).catch(() => {
      throw new Error(
        "Failed to recharge account for the user. User doesn`t exists."
      );
    });

    // Recharge amount based on txn id
    switch (txnId) {
      case "upg100":
        rechargeAmmount = 100;
        break;
      case "upg500":
        rechargeAmmount = 500;
        break;
      case "upg1000":
        rechargeAmmount = 1000;
        break;
      default:
        throw new Error("Invalid Bank Transaction ID");
    }

    existingUserObject.upgradCoins += rechargeAmmount;

    // Create a new instance of user model and update the asset on the ledger
    const updatedUserObject = User.createInstance(existingUserObject);
    await ctx.userList.addUser(updatedUserObject);

    return updatedUserObject;
  }

  /**
   * View registered user details
   * @param ctx - The transaction context object
   * @param name - Name of the user
   * @param aadharNumber - Aadhar Number of the user
   * @returns {Object}
   */
  async viewUser(ctx, name, aadharNumber) {
    validateUserInitiator(ctx);

    const userKey = User.createKey([name, aadharNumber]);

    // Validate whether user is registered
    const userObj = await ctx.userList.getUser(userKey).catch((err) => {
      throw new Error("Failed to fetch user. User does not exists", err);
    });

    return userObj;
  }

  /**
   * New property registration request
   * @param ctx - The transaction context object
   * @param name - Name of the user
   * @param aadharNumber - Aadhar Number of the user
   * @param propertyId - Property id of the property registered
   * @param price - Price for the property
   * @returns {Object}
   */
  async propertyRegistrationRequest(
    ctx,
    name,
    aadharNumber,
    propertyId,
    price
  ) {
    validateUserInitiator(ctx);

    const propertyReqKey = Request.createKey([propertyId, name, aadharNumber]);

    // Validate whether same request already exists
    const existingPropertyReq = await ctx.requestList
      .getUserRequest(propertyReqKey)
      .catch(() => console.log("Creating property registration request..."));

    if (existingPropertyReq) throw new Error("Property request already exists");

    // Validate whether user is registered on the network
    await this.viewUser(ctx, name, aadharNumber);

    const regReqObj = {
      name,
      aadharNumber: aadharNumber,
      owner: propertyReqKey,
      propertyId,
      price: parseInt(price),
      status: null,
    };

    // Create a new instance of request model and add the request asset to the ledger
    const propertyReqObj = Request.createInstance(regReqObj);
    await ctx.requestList.addUserRequest(propertyReqObj);

    return propertyReqObj;
  }

  /**
   * View user's property
   * @param ctx - The transaction context object
   * @param name - Name of the user
   * @param aadharNumber - Aadhar Number of the user
   * @param propertyId - Property id of the property registered
   * @returns {Object}
   */
  async viewProperty(ctx, name, aadharNumber, propertyId) {
    validateUserInitiator(ctx);

    const propertyKey = Property.createKey([propertyId, name, aadharNumber]);

    // Fetch the existing property asset for the user
    const propertyObject = await ctx.propertyList
      .getProperty(propertyKey)
      .catch((err) => {
        throw new Error(
          "Failed to fetch property. Property does not exist for the user",
          err
        );
      });

    return propertyObject;
  }

  /**
   * Update property
   * @param ctx - The transaction context object
   * @param name - Name of the user
   * @param aadharNumber - Aadhar Number of the user
   * @param propertyId - Property id of the property registered
   * @param status - Status of the property
   * @returns {Object}
   */
  async updateProperty(ctx, name, aadharNumber, propertyId, status) {
    validateUserInitiator(ctx);

    // Fetch the registered property asset for the user
    const propertyObject = await this.viewProperty(
      ctx,
      name,
      aadharNumber,
      propertyId
    );
    const { owner } = propertyObject;
    const expectedOwner = `"${propertyId}":"${name}":"${aadharNumber}"`;

    // Validate whether the requested user is the owner of the property
    if (owner !== expectedOwner)
      throw new Error(
        "Access Denied! Requestor is not the owner of the property."
      );

    // Create a new instance of property model and update the status of the property asset on the ledger
    const updatedPropertyObject = Property.createInstance(
      Object.assign(propertyObject, { status })
    );
    await ctx.propertyList.addProperty(updatedPropertyObject);

    return updatedPropertyObject;
  }

  /**
   * Purchase property
   * @param ctx - The transaction context object
   * @param propertyId - Property id of the property registered
   * @param buyerName - Name of the user
   * @param buyerAadharNumber - Aadhar Number of the user
   * @returns {Object}
   */
  async purchaseProperty(ctx, propertyId, buyerName, buyerAadharNumber) {
    try {
      validateUserInitiator(ctx);

      const propertyKey = Property.createKey([propertyId]);
      // Fetch the buyer's registered details
      const buyerObject = await this.viewUser(
        ctx,
        buyerName,
        buyerAadharNumber
      );
      const { upgradCoins: buyerBalance } = buyerObject;

      // Fetch the requested property asset
      const propertyObject = await ctx.propertyList
        .getPropertyByPartialCompositeKey(propertyKey)
        .catch((err) => {
          throw new Error("Requested property does not exists", err);
        });

      // Get the property and seller details
      const {
        status,
        price: propertyPrice,
        name: sellerName,
        aadharNumber: sellerAadharNumber,
      } = propertyObject;
      const sellerObject = await this.viewUser(
        ctx,
        sellerName,
        sellerAadharNumber
      );
      const { upgradCoins: sellerBalance } = sellerObject;

      // Validate whether the property is on sale
      if (status != "onSale")
        throw new Error("Property is not listed for sale.");

      // Validate whether the buyer has sufficient balance to transact
      if (buyerBalance < propertyPrice)
        throw new Error("Insufficient balance for the transaction");

      // update the user details on the ledger
      const updatedBuyerObject = Object.assign({}, buyerObject, {
        upgradCoins: buyerBalance - propertyPrice,
      });
      const updatedSellerObject = Object.assign({}, sellerObject, {
        upgradCoins: sellerBalance + propertyPrice,
      });
      const buyerInstance = User.createInstance(updatedBuyerObject);
      const sellerInstance = User.createInstance(updatedSellerObject);
      await ctx.userList.addUser(buyerInstance);
      await ctx.userList.addUser(sellerInstance);

      //Update the property under buyer's name and change it to registered
      const updatedPropertyKey = Property.createKey([
        propertyId,
        buyerName,
        buyerAadharNumber,
      ]);
      const updatedPropertyObject = Object.assign({}, propertyObject, {
        key: updatedPropertyKey,
        name: buyerName,
        aadharNumber: buyerAadharNumber,
        owner: updatedPropertyKey,
        status: "registered",
      });

      // Delete the existing property under seller's name and add the property under buyer's name
      const deletePropertyInstance = Property.createInstance(propertyObject);
      const updatePropertyInstance = Property.createInstance(
        updatedPropertyObject
      );
      await ctx.propertyList.deleteProperty(deletePropertyInstance);
      await ctx.propertyList.addProperty(updatePropertyInstance);

      return updatePropertyInstance;
    } catch (err) {
      console.log("Property purchase failed");
      throw err;
    }
  }
}

module.exports = UserContract;
