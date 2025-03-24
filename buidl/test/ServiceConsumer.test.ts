import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("ServiceConsumer", function() {
  let ServiceConsumer: any;
  let serviceConsumer: Contract;
  let TestService: any;
  let testService: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy a test service
    TestService = await ethers.getContractFactory("TestService");
    testService = await TestService.deploy();
    await testService.deployed();
    
    // Deploy the service consumer
    ServiceConsumer = await ethers.getContractFactory("TestServiceConsumer");
    serviceConsumer = await ServiceConsumer.deploy();
    await serviceConsumer.deployed();
    
    // Initialize
    await serviceConsumer.initialize();
  });

  describe("Service Management", function() {
    it("Should set and get services correctly", async function() {
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      const serviceAddress = testService.address;
      
      await serviceConsumer.setDSService(serviceId, serviceAddress);
      
      expect(await serviceConsumer.getDSService(serviceId)).to.equal(serviceAddress);
    });
    
    it("Should emit ServiceUpdated event when setting a service", async function() {
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      const serviceAddress = testService.address;
      
      await expect(serviceConsumer.setDSService(serviceId, serviceAddress))
        .to.emit(serviceConsumer, "ServiceUpdated")
        .withArgs(serviceId, serviceAddress);
    });
    
    it("Should prevent non-owner from setting services", async function() {
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      const serviceAddress = testService.address;
      
      await expect(
        serviceConsumer.connect(addr1).setDSService(serviceId, serviceAddress)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Service Consumption", function() {
    it("Should successfully use a service", async function() {
      // Set up the test service
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      await serviceConsumer.setDSService(serviceId, testService.address);
      
      // Call a function on the service
      const result = await serviceConsumer.callTestService(42);
      
      // Verify result (TestService returns input + 1)
      expect(result).to.equal(43);
    });
    
    it("Should revert when service is not set", async function() {
      const serviceId = ethers.utils.formatBytes32String("NONEXISTENT_SERVICE");
      
      await expect(
        serviceConsumer.callNonexistentService()
      ).to.be.revertedWith("Service not configured");
    });
    
    it("Should handle updating a service", async function() {
      // Set up the initial test service
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      await serviceConsumer.setDSService(serviceId, testService.address);
      
      // Deploy a new version of the service
      const TestServiceV2 = await ethers.getContractFactory("TestServiceV2");
      const testServiceV2 = await TestServiceV2.deploy();
      await testServiceV2.deployed();
      
      // Update the service
      await serviceConsumer.setDSService(serviceId, testServiceV2.address);
      
      // Call a function on the service
      const result = await serviceConsumer.callTestService(42);
      
      // Verify result (TestServiceV2 returns input * 2)
      expect(result).to.equal(84);
    });
  });

  describe("Multiple Services", function() {
    it("Should handle multiple services correctly", async function() {
      // Set up the first service
      const serviceId1 = ethers.utils.formatBytes32String("TEST_SERVICE_1");
      await serviceConsumer.setDSService(serviceId1, testService.address);
      
      // Deploy a second service
      const TestServiceV2 = await ethers.getContractFactory("TestServiceV2");
      const testServiceV2 = await TestServiceV2.deploy();
      await testServiceV2.deployed();
      
      // Set up the second service
      const serviceId2 = ethers.utils.formatBytes32String("TEST_SERVICE_2");
      await serviceConsumer.setDSService(serviceId2, testServiceV2.address);
      
      // Call both services
      const result1 = await serviceConsumer.callTestService1(10);
      const result2 = await serviceConsumer.callTestService2(10);
      
      // Verify results
      expect(result1).to.equal(11);  // TestService returns input + 1
      expect(result2).to.equal(20);  // TestServiceV2 returns input * 2
    });
    
    it("Should maintain service dependencies across upgrades", async function() {
      // Set up the service
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      await serviceConsumer.setDSService(serviceId, testService.address);
      
      // Deploy new version of the consumer
      const ServiceConsumerV2 = await ethers.getContractFactory("TestServiceConsumerV2");
      const consumerV2 = await ServiceConsumerV2.deploy();
      await consumerV2.deployed();
      
      // Upgrade the consumer (assuming using UUPS pattern)
      await serviceConsumer.upgradeTo(consumerV2.address);
      
      // Access the upgraded contract
      const upgradedConsumer = ServiceConsumerV2.attach(serviceConsumer.address);
      
      // Service should still be accessible
      expect(await upgradedConsumer.getDSService(serviceId)).to.equal(testService.address);
      
      // Should have access to new functionality
      const result = await upgradedConsumer.callTestServiceV2(10);
      expect(result).to.equal(11);
    });
  });

  describe("Service Dependency Validation", function() {
    it("Should validate required services", async function() {
      // Call a function that requires a specific service
      await expect(
        serviceConsumer.callRequiredService()
      ).to.be.revertedWith("REQUIRED_SERVICE not set");
      
      // Set up the required service
      const requiredServiceId = ethers.utils.formatBytes32String("REQUIRED_SERVICE");
      await serviceConsumer.setDSService(requiredServiceId, testService.address);
      
      // Now the call should succeed
      await serviceConsumer.callRequiredService();
    });
    
    it("Should enforce service interface requirements", async function() {
      // Deploy a service with an incompatible interface
      const IncompatibleService = await ethers.getContractFactory("IncompatibleService");
      const incompatibleService = await IncompatibleService.deploy();
      await incompatibleService.deployed();
      
      // Set up the service
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      await serviceConsumer.setDSService(serviceId, incompatibleService.address);
      
      // Call should fail because the interface doesn't match
      await expect(
        serviceConsumer.callTestService(42)
      ).to.be.reverted;
    });
  });
});