import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("ComplianceServiceRegulated", function() {
  let ComplianceServiceRegulated: any;
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
    ComplianceServiceRegulated = await ethers.getContractFactory("ComplianceServiceRegulated");
    complianceService = await ComplianceServiceRegulated.deploy();
    await complianceService.deployed();
    
    // Initialize the compliance service
    await complianceService.initialize();
    
    // Set the mock dependencies
    await complianceService.setDSService(await complianceService.TOKEN(), mockToken.address);
    await complianceService.setDSService(await complianceService.WALLET_MANAGER(), mockWalletManager.address);
    await complianceService.setDSService(await complianceService.REGISTRY_SERVICE(), mockRegistryService.address);
    await complianceService.setDSService(await complianceService.LOCK_MANAGER(), mockLockManager.address);
    await complianceService.setDSService(await complianceService.COMPLIANCE_CONFIGURATION_SERVICE(), mockComplianceConfigService.address);
    
    // Setup the mocks with default behaviors
    await mockToken.mock.isPaused.returns(false);
    await mockToken.mock.balanceOf.returns(ethers.utils.parseEther("100"));
    await mockToken.mock.totalSupply.returns(ethers.utils.parseEther("1000"));
    await mockWalletManager.mock.isPlatformWallet.returns(false);
    await mockWalletManager.mock.isIssuerSpecialWallet.returns(false);
    await mockRegistryService.mock.getInvestor.returns("");
    await mockLockManager.mock.getTransferableTokens.returns(ethers.utils.parseEther("100"));
    await mockComplianceConfigService.mock.getAuthorizedSecurities.returns(ethers.utils.parseEther("5000"));
    await mockComplianceConfigService.mock.getDisallowBackDating.returns(false);
    await mockComplianceConfigService.mock.getMaxInvestorCount.returns(0);  // No limit
    await mockComplianceConfigService.mock.getMaxTokensPerWallet.returns(0); // No limit
  });

  describe("Regulated Transfer Validation", function() {
    it("Should allow transfer to whitelisted wallet with no regulatory limits", async function() {
      // Setup whitelisted target
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      
      // Set no regulatory limits
      await mockComplianceConfigService.mock.getMaxTokensPerWallet.returns(0);
      
      // Check transfer validation
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("50")
      );
      
      expect(result[0]).to.equal(0); // Valid code
      expect(result[1]).to.equal("Valid");
    });
    
    it("Should respect the max tokens per wallet limit", async function() {
      // Setup whitelisted target
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      
      // Set max tokens per wallet to 30
      await mockComplianceConfigService.mock.getMaxTokensPerWallet.returns(ethers.utils.parseEther("30"));
      
      // Target already has 10 tokens
      await mockToken.mock.balanceOf.withArgs(await addr1.getAddress()).returns(ethers.utils.parseEther("10"));
      
      // Should fail if trying to transfer more than allowed
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("25")
      );
      
      expect(result[0]).to.equal(30); // Max tokens per wallet limit exceeded
      expect(result[1]).to.equal("Investor is not allowed to receive more tokens");
    });
    
    it("Should allow transfer if within max tokens per wallet limit", async function() {
      // Setup whitelisted target
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      
      // Set max tokens per wallet to 30
      await mockComplianceConfigService.mock.getMaxTokensPerWallet.returns(ethers.utils.parseEther("30"));
      
      // Target already has 10 tokens
      await mockToken.mock.balanceOf.withArgs(await addr1.getAddress()).returns(ethers.utils.parseEther("10"));
      
      // Should succeed if within limit
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("15")
      );
      
      expect(result[0]).to.equal(0); // Valid
      expect(result[1]).to.equal("Valid");
    });
  });

  describe("Investor Count Limits", function() {
    it("Should enforce maximum investor count limits", async function() {
      // Setup mock behavior
      await mockComplianceConfigService.mock.getMaxInvestorCount.returns(1);
      
      // Mock registry to return current investors count as 1
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      await mockRegistryService.mock.getInvestor.withArgs(await owner.getAddress()).returns("Owner");
      await mockRegistryService.mock.getInvestor.withArgs(await addr2.getAddress()).returns("");
      
      // Setup regulated compliance state - owner is the only investor with tokens currently
      await complianceService.setInvestorsWithTokensCount(1);
      
      // The new investor should have no balance initially
      await mockToken.mock.balanceOf.withArgs(await addr2.getAddress()).returns(0);
      
      // Should restrict new investors when limit reached
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr2.getAddress(), 
        ethers.utils.parseEther("10")
      );
      
      expect(result[0]).to.equal(40); // Max investors count limit exceeded
      expect(result[1]).to.equal("Max token holders limit reached");
    });
    
    it("Should allow transfers to existing investors even at investor limit", async function() {
      // Setup mock behavior
      await mockComplianceConfigService.mock.getMaxInvestorCount.returns(2);
      
      // Two investors already registered and have tokens
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      await mockRegistryService.mock.getInvestor.withArgs(await owner.getAddress()).returns("Owner");
      await mockToken.mock.balanceOf.withArgs(await addr1.getAddress()).returns(ethers.utils.parseEther("10"));
      
      // Setup regulated compliance state
      await complianceService.setInvestorsWithTokensCount(2);
      
      // Transfer between existing investors should be allowed
      const result = await complianceService.preTransferCheck(
        await owner.getAddress(), 
        await addr1.getAddress(), 
        ethers.utils.parseEther("10")
      );
      
      expect(result[0]).to.equal(0); // Valid
      expect(result[1]).to.equal("Valid");
    });
  });

  describe("Issuance Validation", function() {
    it("Should enforce max tokens per wallet on issuance", async function() {
      // Setup whitelisted target
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      
      // Set max tokens per wallet to 50
      await mockComplianceConfigService.mock.getMaxTokensPerWallet.returns(ethers.utils.parseEther("50"));
      
      // Target already has 40 tokens
      await mockToken.mock.balanceOf.withArgs(await addr1.getAddress()).returns(ethers.utils.parseEther("40"));
      
      // Should fail if trying to issue more than allowed
      const result = await complianceService.preIssuanceCheck(
        await addr1.getAddress(), 
        ethers.utils.parseEther("15")
      );
      
      expect(result[0]).to.equal(30); // Max tokens per wallet limit exceeded
      expect(result[1]).to.equal("Investor is not allowed to receive more tokens");
    });
    
    it("Should validate issuance time based on back dating configuration", async function() {
      // Setup whitelisted target
      await mockRegistryService.mock.getInvestor.withArgs(await addr1.getAddress()).returns("Investor1");
      
      // Check with backdating allowed
      await mockComplianceConfigService.mock.getDisallowBackDating.returns(false);
      const pastTime = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      
      expect(await complianceService.validateIssuanceTime(pastTime)).to.equal(pastTime);
      
      // Check with backdating disallowed
      await mockComplianceConfigService.mock.getDisallowBackDating.returns(true);
      const nowApprox = Math.floor(Date.now() / 1000);
      
      // Should return current time, not past time
      const result = await complianceService.validateIssuanceTime(pastTime);
      expect(result).to.be.closeTo(nowApprox, 5); // Allow 5 seconds tolerance
      expect(result).to.not.equal(pastTime);
    });
  });

  describe("Record Keeping", function() {
    it("Should properly track investors with tokens", async function() {
      // Initial state
      expect(await complianceService.getInvestorsWithTokensCount()).to.equal(0);
      
      // Set count to 2
      await complianceService.setInvestorsWithTokensCount(2);
      expect(await complianceService.getInvestorsWithTokensCount()).to.equal(2);
      
      // Can be increased
      await complianceService.setInvestorsWithTokensCount(5);
      expect(await complianceService.getInvestorsWithTokensCount()).to.equal(5);
      
      // Can be decreased
      await complianceService.setInvestorsWithTokensCount(3);
      expect(await complianceService.getInvestorsWithTokensCount()).to.equal(3);
    });
    
    it("Should prevent non-owner from changing investor count", async function() {
      await expect(
        complianceService.connect(addr1).setInvestorsWithTokensCount(5)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});