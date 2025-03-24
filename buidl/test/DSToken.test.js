
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DSToken", function() {
  let DSToken;
  let token;
  let owner;
  let addr1;
  let addr2;
  let TokenLibrary;
  let tokenLibrary;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy TokenLibrary first
    TokenLibrary = await ethers.getContractFactory("TokenLibrary");
    tokenLibrary = await TokenLibrary.deploy();
    await tokenLibrary.deployed();

    // Deploy DSToken with library
    DSToken = await ethers.getContractFactory("DSToken", {
      libraries: {
        TokenLibrary: tokenLibrary.address
      }
    });
    token = await DSToken.deploy();
    await token.deployed();

    // Initialize token
    await token.initialize("Example Token", "EXTKN", 18);
  });

  describe("Initialization", function() {
    it("Should set the correct name, symbol and decimals", async function() {
      expect(await token.name()).to.equal("Example Token");
      expect(await token.symbol()).to.equal("EXTKN");
      expect(await token.decimals()).to.equal(18);
    });

    it("Should set owner as admin", async function() {
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("Service Management", function() {
    it("Should set and get DS services correctly", async function() {
      const registryService = await token.REGISTRY_SERVICE();
      await token.setDSService(registryService, addr1.address);
      expect(await token.getDSService(registryService)).to.equal(addr1.address);
    });

    it("Should revert when non-owner tries to set service", async function() {
      const registryService = await token.REGISTRY_SERVICE();
      await expect(
        token.connect(addr1).setDSService(registryService, addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Role Management", function() {
    it("Should assign roles through trust service", async function() {
      // Mock trust service by using owner address
      const trustService = await token.TRUST_SERVICE();
      await token.setDSService(trustService, owner.address);
      
      const masterRole = await token.ROLE_MASTER();
      const issuerRole = await token.ROLE_ISSUER();
      
      await token.setRole(addr1.address, masterRole);
      await token.setRole(addr1.address, issuerRole);
      
      // Verify roles through trust service
      expect(await token.hasRole(addr1.address, masterRole)).to.be.true;
      expect(await token.hasRole(addr1.address, issuerRole)).to.be.true;
    });
  });

  describe("Transfer Functionality", function() {
    beforeEach(async function() {
      // Setup required services and roles for transfer testing
      const services = [
        await token.COMPLIANCE_SERVICE(),
        await token.TRUST_SERVICE(),
        await token.REGISTRY_SERVICE(),
        await token.WALLET_MANAGER()
      ];

      for (const service of services) {
        await token.setDSService(service, owner.address);
      }

      // Set issuer role to owner
      const issuerRole = await token.ROLE_ISSUER();
      await token.setRole(owner.address, issuerRole);
    });

    it("Should transfer tokens between accounts", async function() {
      // Mint tokens to owner
      await token.mint(owner.address, ethers.utils.parseEther("100"));
      
      // Transfer tokens
      await token.transfer(addr1.address, ethers.utils.parseEther("50"));
      
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("50"));
      expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("50"));
    });
  });

  describe("Minting and Burning", function() {
    beforeEach(async function() {
      // Setup required services
      const services = [
        await token.COMPLIANCE_SERVICE(),
        await token.TRUST_SERVICE()
      ];

      for (const service of services) {
        await token.setDSService(service, owner.address);
      }

      // Set issuer role to owner
      const issuerRole = await token.ROLE_ISSUER();
      await token.setRole(owner.address, issuerRole);
    });

    it("Should mint tokens correctly", async function() {
      await token.mint(addr1.address, ethers.utils.parseEther("100"));
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should burn tokens correctly", async function() {
      await token.mint(addr1.address, ethers.utils.parseEther("100"));
      await token.burn(addr1.address, ethers.utils.parseEther("50"));
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("50"));
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("50"));
    });
  });
});
