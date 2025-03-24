import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("BaseDSContract", function() {
  let TestBaseDSContract: any;
  let baseContract: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let proxyAdmin: Contract;
  let baseImplementation: Contract;
  let proxy: Contract;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the base implementation contract
    TestBaseDSContract = await ethers.getContractFactory("TestBaseDSContract");
    baseImplementation = await TestBaseDSContract.deploy();
    await baseImplementation.deployed();
    
    // Deploy ProxyAdmin
    const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
    proxyAdmin = await ProxyAdmin.deploy();
    await proxyAdmin.deployed();
    
    // Deploy TransparentUpgradeableProxy
    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
    const initData = baseImplementation.interface.encodeFunctionData("initialize");
    
    proxy = await Proxy.deploy(
      baseImplementation.address,
      proxyAdmin.address,
      initData
    );
    await proxy.deployed();
    
    // Connect to the proxy as the implementation
    baseContract = TestBaseDSContract.attach(proxy.address);
  });

  describe("Initialization", function() {
    it("Should set the owner correctly upon initialization", async function() {
      expect(await baseContract.owner()).to.equal(await owner.getAddress());
    });
    
    it("Should not allow re-initialization", async function() {
      await expect(
        baseContract.initialize()
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("Service Management", function() {
    it("Should set and get DS services correctly", async function() {
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      const serviceAddress = await addr1.getAddress();
      
      await baseContract.setDSService(serviceId, serviceAddress);
      
      expect(await baseContract.getDSService(serviceId)).to.equal(serviceAddress);
    });
    
    it("Should prevent non-owner from setting DS services", async function() {
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      const serviceAddress = await addr1.getAddress();
      
      await expect(
        baseContract.connect(addr1).setDSService(serviceId, serviceAddress)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should emit ServiceUpdated event when setting a service", async function() {
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      const serviceAddress = await addr1.getAddress();
      
      await expect(baseContract.setDSService(serviceId, serviceAddress))
        .to.emit(baseContract, "ServiceUpdated")
        .withArgs(serviceId, serviceAddress);
    });
  });

  describe("Upgradeability", function() {
    it("Should allow owner to upgrade implementation", async function() {
      // Deploy a new implementation
      const NewImplementation = await ethers.getContractFactory("TestBaseDSContractV2");
      const newImplementation = await NewImplementation.deploy();
      await newImplementation.deployed();
      
      // Upgrade proxy to new implementation
      await baseContract.upgradeTo(newImplementation.address);
      
      // Connect to the proxy with new ABI
      const upgradedContract = NewImplementation.attach(proxy.address);
      
      // Check new functionality
      await upgradedContract.setVersion(2);
      expect(await upgradedContract.getVersion()).to.equal(2);
      
      // Legacy functionality should still work
      expect(await upgradedContract.owner()).to.equal(await owner.getAddress());
    });
    
    it("Should prevent non-owner from upgrading implementation", async function() {
      // Deploy a new implementation
      const NewImplementation = await ethers.getContractFactory("TestBaseDSContractV2");
      const newImplementation = await NewImplementation.deploy();
      await newImplementation.deployed();
      
      // Non-owner attempt to upgrade should fail
      await expect(
        baseContract.connect(addr1).upgradeTo(newImplementation.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Common Functionality", function() {
    it("Should allow transferring ownership", async function() {
      const newOwner = await addr1.getAddress();
      
      // Transfer ownership
      await baseContract.transferOwnership(newOwner);
      
      expect(await baseContract.owner()).to.equal(newOwner);
    });
    
    it("Should emit OwnershipTransferred event", async function() {
      const newOwner = await addr1.getAddress();
      const currentOwner = await owner.getAddress();
      
      await expect(baseContract.transferOwnership(newOwner))
        .to.emit(baseContract, "OwnershipTransferred")
        .withArgs(currentOwner, newOwner);
    });
    
    it("Should protect critical functions with onlyOwner modifier", async function() {
      // Various operations that should be protected
      const serviceId = ethers.utils.formatBytes32String("TEST_SERVICE");
      const serviceAddress = await addr1.getAddress();
      
      // All should fail with non-owner
      await expect(
        baseContract.connect(addr1).setDSService(serviceId, serviceAddress)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(
        baseContract.connect(addr1).transferOwnership(await addr2.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Role Management", function() {
    it("Should defer role management to trust service", async function() {
      // Setup mock trust service
      const MockTrustService = await ethers.getContractFactory("MockTrustService");
      const mockTrustService = await MockTrustService.deploy();
      await mockTrustService.deployed();
      
      // Set trust service
      const trustServiceId = await baseContract.TRUST_SERVICE();
      await baseContract.setDSService(trustServiceId, mockTrustService.address);
      
      // Setup mock behavior
      await mockTrustService.mock.hasRole.returns(true);
      
      // Test role checking
      const userAddress = await addr1.getAddress();
      const roleId = ethers.utils.formatBytes32String("TEST_ROLE");
      
      expect(await baseContract.hasRole(userAddress, roleId)).to.be.true;
      
      // Verify the call was made correctly
      expect('hasRole').to.be.calledOnContractWith(mockTrustService, [
        userAddress, roleId
      ]);
    });
    
    it("Should defer role assignment to trust service", async function() {
      // Setup mock trust service
      const MockTrustService = await ethers.getContractFactory("MockTrustService");
      const mockTrustService = await MockTrustService.deploy();
      await mockTrustService.deployed();
      
      // Set trust service
      const trustServiceId = await baseContract.TRUST_SERVICE();
      await baseContract.setDSService(trustServiceId, mockTrustService.address);
      
      // Setup mock behavior
      await mockTrustService.mock.setRole.returns(true);
      
      // Test role setting
      const userAddress = await addr1.getAddress();
      const roleId = ethers.utils.formatBytes32String("TEST_ROLE");
      
      await baseContract.setRole(userAddress, roleId);
      
      // Verify the call was made correctly
      expect('setRole').to.be.calledOnContractWith(mockTrustService, [
        userAddress, roleId
      ]);
    });
  });
});