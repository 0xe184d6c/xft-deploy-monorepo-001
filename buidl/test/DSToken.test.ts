
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("DSToken", function() {
  let DSToken: any;
  let token: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let TokenLibrary: any;
  let tokenLibrary: Contract;

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
      expect(await token.owner()).to.equal(await owner.getAddress());
    });
  });

  describe("Service Management", function() {
    it("Should set and get DS services correctly", async function() {
      const registryService = await token.REGISTRY_SERVICE();
      await token.setDSService(registryService, await addr1.getAddress());
      expect(await token.getDSService(registryService)).to.equal(await addr1.getAddress());
    });

    it("Should revert when non-owner tries to set service", async function() {
      const registryService = await token.REGISTRY_SERVICE();
      await expect(
        token.connect(addr1).setDSService(registryService, await addr2.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Role Management", function() {
    it("Should assign roles through trust service", async function() {
      const trustService = await token.TRUST_SERVICE();
      await token.setDSService(trustService, await owner.getAddress());
      
      const masterRole = await token.ROLE_MASTER();
      const issuerRole = await token.ROLE_ISSUER();
      
      await token.setRole(await addr1.getAddress(), masterRole);
      await token.setRole(await addr1.getAddress(), issuerRole);
      
      expect(await token.hasRole(await addr1.getAddress(), masterRole)).to.be.true;
      expect(await token.hasRole(await addr1.getAddress(), issuerRole)).to.be.true;
    });
  });

  describe("Transfer Functionality", function() {
    beforeEach(async function() {
      const services = [
        await token.COMPLIANCE_SERVICE(),
        await token.TRUST_SERVICE(),
        await token.REGISTRY_SERVICE(),
        await token.WALLET_MANAGER()
      ];

      for (const service of services) {
        await token.setDSService(service, await owner.getAddress());
      }

      const issuerRole = await token.ROLE_ISSUER();
      await token.setRole(await owner.getAddress(), issuerRole);
    });

    it("Should transfer tokens between accounts", async function() {
      await token.mint(await owner.getAddress(), ethers.utils.parseEther("100"));
      await token.transfer(await addr1.getAddress(), ethers.utils.parseEther("50"));
      
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(ethers.utils.parseEther("50"));
      expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther("50"));
    });
  });

  describe("Minting and Burning", function() {
    beforeEach(async function() {
      const services = [
        await token.COMPLIANCE_SERVICE(),
        await token.TRUST_SERVICE()
      ];

      for (const service of services) {
        await token.setDSService(service, await owner.getAddress());
      }

      const issuerRole = await token.ROLE_ISSUER();
      await token.setRole(await owner.getAddress(), issuerRole);
    });

    it("Should mint tokens correctly", async function() {
      await token.mint(await addr1.getAddress(), ethers.utils.parseEther("100"));
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(ethers.utils.parseEther("100"));
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should burn tokens correctly", async function() {
      await token.mint(await addr1.getAddress(), ethers.utils.parseEther("100"));
      await token.burn(await addr1.getAddress(), ethers.utils.parseEther("50"));
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(ethers.utils.parseEther("50"));
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("50"));
    });
  });
});
