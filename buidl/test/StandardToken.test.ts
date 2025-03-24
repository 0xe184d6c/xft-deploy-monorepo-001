import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("StandardToken", function() {
  let TokenImplementation: any;
  let token: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let tbeController: Contract;
  let mockComplianceService: Contract;
  let mockTrustService: Contract;
  let mockRegistryService: Contract;
  let mockWalletManager: Contract;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the mock services
    const MockComplianceService = await ethers.getContractFactory("MockComplianceService");
    mockComplianceService = await MockComplianceService.deploy();
    await mockComplianceService.deployed();
    
    const MockTrustService = await ethers.getContractFactory("MockTrustService");
    mockTrustService = await MockTrustService.deploy();
    await mockTrustService.deployed();
    
    const MockRegistryService = await ethers.getContractFactory("MockRegistryService");
    mockRegistryService = await MockRegistryService.deploy();
    await mockRegistryService.deployed();
    
    const MockWalletManager = await ethers.getContractFactory("MockWalletManager");
    mockWalletManager = await MockWalletManager.deploy();
    await mockWalletManager.deployed();
    
    // Deploy TBE controller
    const TBEController = await ethers.getContractFactory("OmnibusTBEController");
    tbeController = await TBEController.deploy();
    await tbeController.deployed();
    await tbeController.initialize();
    
    // For the test, we'll use a concrete implementation that inherits from StandardToken
    TokenImplementation = await ethers.getContractFactory("TestStandardToken");
    token = await TokenImplementation.deploy();
    await token.deployed();
    
    // Initialize token
    await token.initialize("Standard Test Token", "STT", 18);
    
    // Set services
    await token.setDSService(await token.COMPLIANCE_SERVICE(), mockComplianceService.address);
    await token.setDSService(await token.TRUST_SERVICE(), mockTrustService.address);
    await token.setDSService(await token.REGISTRY_SERVICE(), mockRegistryService.address);
    await token.setDSService(await token.WALLET_MANAGER(), mockWalletManager.address);
    await token.setDSService(await token.OMNIBUS_TBE_CONTROLLER(), tbeController.address);
    
    // Set up mock behaviors
    await mockComplianceService.mock.validateTransfer.returns(true);
    await mockComplianceService.mock.validateIssuance.returns(true);
    await mockComplianceService.mock.validateBurn.returns(true);

    // Set roles for owner
    await mockTrustService.mock.hasRole.returns(true); // Allow all roles for test
  });

  describe("Token Core Functionality", function() {
    it("Should have correct initialization values", async function() {
      expect(await token.name()).to.equal("Standard Test Token");
      expect(await token.symbol()).to.equal("STT");
      expect(await token.decimals()).to.equal(18);
      expect(await token.isPaused()).to.equal(false);
      expect(await token.totalSupply()).to.equal(0);
    });
    
    it("Should allow owner to mint tokens", async function() {
      await token.mint(await addr1.getAddress(), ethers.utils.parseEther("100"));
      
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(ethers.utils.parseEther("100"));
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("100"));
    });
    
    it("Should allow token transfers", async function() {
      // Mint tokens to addr1
      await token.mint(await addr1.getAddress(), ethers.utils.parseEther("100"));
      
      // Transfer from addr1 to addr2
      await token.connect(addr1).transfer(await addr2.getAddress(), ethers.utils.parseEther("50"));
      
      // Check balances
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(ethers.utils.parseEther("50"));
      expect(await token.balanceOf(await addr2.getAddress())).to.equal(ethers.utils.parseEther("50"));
    });
    
    it("Should allow token burning", async function() {
      // Mint tokens to addr1
      await token.mint(await addr1.getAddress(), ethers.utils.parseEther("100"));
      
      // Burn tokens
      await token.burn(await addr1.getAddress(), ethers.utils.parseEther("30"));
      
      // Check balance and total supply
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(ethers.utils.parseEther("70"));
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("70"));
    });
  });

  describe("Token Pause Functionality", function() {
    it("Should allow owner to pause and unpause the token", async function() {
      // Token should be unpaused initially
      expect(await token.isPaused()).to.equal(false);
      
      // Pause the token
      await token.pause();
      expect(await token.isPaused()).to.equal(true);
      
      // Unpause the token
      await token.unpause();
      expect(await token.isPaused()).to.equal(false);
    });
    
    it("Should prevent non-owner from pausing the token", async function() {
      await expect(
        token.connect(addr1).pause()
      ).to.be.reverted;
    });
    
    it("Should prevent transfers when paused", async function() {
      // Mint some tokens first
      await token.mint(await addr1.getAddress(), ethers.utils.parseEther("100"));
      
      // Pause the token
      await token.pause();
      
      // Setup mock to reject transfers when paused
      await mockComplianceService.mock.validateTransfer.returns(false);
      
      // Attempt transfer should fail
      await expect(
        token.connect(addr1).transfer(await addr2.getAddress(), ethers.utils.parseEther("50"))
      ).to.be.reverted;
    });
  });

  describe("Approval Functionality", function() {
    it("Should allow approval and transferFrom", async function() {
      // Mint tokens to owner
      await token.mint(await owner.getAddress(), ethers.utils.parseEther("100"));
      
      // Owner approves addr1 to spend tokens
      await token.approve(await addr1.getAddress(), ethers.utils.parseEther("50"));
      
      // Check allowance
      expect(await token.allowance(await owner.getAddress(), await addr1.getAddress()))
        .to.equal(ethers.utils.parseEther("50"));
      
      // addr1 transfers from owner to addr2
      await token.connect(addr1).transferFrom(
        await owner.getAddress(),
        await addr2.getAddress(),
        ethers.utils.parseEther("30")
      );
      
      // Check balances
      expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther("70"));
      expect(await token.balanceOf(await addr2.getAddress())).to.equal(ethers.utils.parseEther("30"));
      
      // Check remaining allowance
      expect(await token.allowance(await owner.getAddress(), await addr1.getAddress()))
        .to.equal(ethers.utils.parseEther("20"));
    });
    
    it("Should allow increasing and decreasing allowance", async function() {
      // Initial approval
      await token.approve(await addr1.getAddress(), ethers.utils.parseEther("50"));
      
      // Increase allowance
      await token.increaseApproval(await addr1.getAddress(), ethers.utils.parseEther("20"));
      expect(await token.allowance(await owner.getAddress(), await addr1.getAddress()))
        .to.equal(ethers.utils.parseEther("70"));
      
      // Decrease allowance
      await token.decreaseApproval(await addr1.getAddress(), ethers.utils.parseEther("30"));
      expect(await token.allowance(await owner.getAddress(), await addr1.getAddress()))
        .to.equal(ethers.utils.parseEther("40"));
    });
    
    it("Should handle decrease greater than current allowance", async function() {
      // Initial approval
      await token.approve(await addr1.getAddress(), ethers.utils.parseEther("50"));
      
      // Decrease by more than allowance
      await token.decreaseApproval(await addr1.getAddress(), ethers.utils.parseEther("100"));
      
      // Allowance should be 0, not negative
      expect(await token.allowance(await owner.getAddress(), await addr1.getAddress()))
        .to.equal(ethers.utils.parseEther("0"));
    });
  });

  describe("Token Service Integration", function() {
    it("Should integrate with compliance service for transfers", async function() {
      // Mock compliance service to validate a specific transfer
      await mockComplianceService.mock.validateTransfer
        .withArgs(await addr1.getAddress(), await addr2.getAddress(), ethers.utils.parseEther("50"))
        .returns(true);
      
      // Mint tokens to addr1
      await token.mint(await addr1.getAddress(), ethers.utils.parseEther("100"));
      
      // Transfer should succeed
      await token.connect(addr1).transfer(await addr2.getAddress(), ethers.utils.parseEther("50"));
      
      // Check balances
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(ethers.utils.parseEther("50"));
      expect(await token.balanceOf(await addr2.getAddress())).to.equal(ethers.utils.parseEther("50"));
    });
    
    it("Should reject transfers that fail compliance", async function() {
      // Mock compliance service to reject transfers
      await mockComplianceService.mock.validateTransfer.returns(false);
      
      // Mint tokens to addr1
      await token.mint(await addr1.getAddress(), ethers.utils.parseEther("100"));
      
      // Transfer should fail
      await expect(
        token.connect(addr1).transfer(await addr2.getAddress(), ethers.utils.parseEther("50"))
      ).to.be.reverted;
    });
  });
});