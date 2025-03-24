const { expect } = require("chai");
const hre = require("hardhat");

describe("Storage1", function () {
  let storage;

  beforeEach(async function () {
    // Deploy a new Storage1 contract before each test
    const Storage1 = await hre.ethers.getContractFactory("Storage1");
    storage = await Storage1.deploy();
  });

  describe("Store and Retrieve", function () {
    it("Should store and retrieve the number", async function () {
      // Store a value
      await storage.store(42);
      
      // Retrieve the value
      const result = await storage.retrieve();
      
      // Check if the value matches what we stored
      expect(result).to.equal(42);
    });

    it("Should update the stored value", async function () {
      // Store initial value
      await storage.store(42);
      
      // Update the value
      await storage.store(100);
      
      // Retrieve and check the updated value
      const result = await storage.retrieve();
      expect(result).to.equal(100);
    });
  });
});