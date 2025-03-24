import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("ComplianceServiceWhitelisted", function() {
  let ComplianceServiceWhitelisted: any;
  let complianceService: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;
  let mockToken: Contract;
  let mockWalletManager: Contract;
  let mockRegistryService: Contract;
  let mockLockManager: Contract;
  let mockComplianceConfigService: Contract;

  beforeEach(async function() {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Mock the dependencies
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy();
    await mockToken.deployed();
    
    const MockWalletManager = await ethers.getContractFactory("MockWalletManager");
    mockWalletManager = await MockWalletManager.deploy();
    await mockWalletManager.deployed();
    
    const MockRegistryService = await ethers.getContractFactory("MockRegistryService");
    mockRegistryService = await MockRegistryService.deploy();
    await mockRegistryService.deployed();
    
    const MockLockManager = await ethers.getContractFactory("MockLockManager");
    mockLockManager = await MockLockManager.deploy();
    await mockLockManager.deployed();
    
    const MockComplianceConfigService = await ethers.getContractFactory("MockComplianceConfigService");
    mockComplianceConfigService = await MockComplianceConfigService.deploy();
    await mockComplianceConfigService.deployed();
    
    // Deploy the compliance service
    ComplianceServiceWhitelisted = await ethers.getContractFactory("ComplianceServiceWhitelisted");
    complianceService = await ComplianceServiceWhitelisted.deploy();
    await complianceService.deployed();
    
    // Initialize the compliance service
    await complianceService.initialize();
    
    // Set the mock dependencies
    await complianceService.setDSService(await complianceService.TOKEN(), mockToken.address);
    await complianceService.setDSService(await complianceService.WALLET_MANAGER(), mockWalletManager.address);
    await complianceService.setDSService(await complianceService.REGISTRY_SERVICE(), mockRegistryService.address);
    await complianceService.setDSService(await complianceService.LOCK_MANAGER(), mockLockManager.address);
    await complianceService.setDSService(await complianceService.COMPLIANCE_CONFIGURATION_SERVICE(), mockComplianceConfigService.address);
    
    // Setup the mocks
    await mockToken.mock.isPaused.returns(false);
    await mockToken.mock.balanceOf.returns(ethers.utils.parseEther("100"));
    await mockWalletManager.mock.isPlatformWallet.returns(false);
    await mockRegistryService.mock.getInvestor.returns("");
    await mockLockManager.mock.getTransferableTokens.returns(ethers.utils.parseEther("100"));
    await mockComplianceConfigService.mock.getAuthorizedSecurities.returns(0);
  });

  describe("Whitelist Validation", function() {
    it("Should allow transfer to whitelisted wallet", async function() {
      // Setup mocks for this test
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      
      // Check transfer validation
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("50")
      );
      
      expect(result[0]).to.equal(0); // Valid code
      expect(result[1]).to.equal("Valid");
    });
    
    it("Should not allow transfer to non-whitelisted wallet", async function() {
      // Check transfer validation to non-whitelisted
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr2.getAddress(), 
        ethers.utils.parseEther("50")
      );
      
      expect(result[0]).to.equal(20); // Error code
      expect(result[1]).to.equal("Wallet not in registry service");
    });

    it("Should allow transfer to platform wallet even if not in registry", async function() {
      // Setup mocks for this test
      await mockWalletManager.mock.isPlatformWallet.withArgs(await addr1.getAddress()).returns(true);
      
      // Check transfer validation
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("50")
      );
      
      expect(result[0]).to.equal(0); // Valid code
      expect(result[1]).to.equal("Valid");
    });
  });

  describe("Token Locks", function() {
    it("Should prevent transfer if tokens are locked", async function() {
      // Setup mocks - tokens are locked
      await mockLockManager.mock.getTransferableTokens
        .withArgs(await owner.getAddress(), ethers.BigNumber.from(Math.floor(Date.now() / 1000)))
        .returns(ethers.utils.parseEther("40"));
      
      // Should fail because only 40 tokens are transferable but trying to transfer 50
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("50")
      );
      
      expect(result[0]).to.equal(16); // Tokens locked
      expect(result[1]).to.equal("Tokens locked");
    });
    
    it("Should not check locks for platform wallets", async function() {
      // Setup mocks - tokens are locked but it's a platform wallet
      await mockWalletManager.mock.isPlatformWallet.withArgs(await owner.getAddress()).returns(true);
      await mockLockManager.mock.getTransferableTokens
        .withArgs(await owner.getAddress(), ethers.BigNumber.from(Math.floor(Date.now() / 1000)))
        .returns(ethers.utils.parseEther("40"));
      
      // Setup target wallet as whitelisted
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      
      // Should succeed because platform wallets bypass lock checks
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("50")
      );
      
      expect(result[0]).to.equal(0); // Valid code
      expect(result[1]).to.equal("Valid");
    });
  });

  describe("Token Status Checks", function() {
    it("Should prevent transfer if token is paused", async function() {
      // Setup mocks - token is paused
      await mockToken.mock.isPaused.returns(true);
      
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("50")
      );
      
      expect(result[0]).to.equal(10); // Token paused
      expect(result[1]).to.equal("Token paused");
    });
    
    it("Should prevent transfer if balance is insufficient", async function() {
      // Setup mocks - insufficient balance
      await mockToken.mock.balanceOf.withArgs(await owner.getAddress()).returns(ethers.utils.parseEther("40"));
      
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("50")
      );
      
      expect(result[0]).to.equal(15); // Not enough tokens
      expect(result[1]).to.equal("Not enough tokens");
    });
  });

  describe("Issuance Validation", function() {
    it("Should validate issuance to whitelisted wallet", async function() {
      // Setup mocks
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      
      const result = await complianceService.preIssuanceCheck(
        await addr1.getAddress(), 
        ethers.utils.parseEther("100")
      );
      
      expect(result[0]).to.equal(0); // Valid
      expect(result[1]).to.equal("Valid");
    });
    
    it("Should reject issuance to non-whitelisted wallet", async function() {
      const result = await complianceService.preIssuanceCheck(
        await addr2.getAddress(), 
        ethers.utils.parseEther("100")
      );
      
      expect(result[0]).to.equal(20); // Error code
      expect(result[1]).to.equal("Wallet not in registry service");
    });
  });
});