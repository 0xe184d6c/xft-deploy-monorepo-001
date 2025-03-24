import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("OmnibusTBEController", function() {
  let OmnibusTBEController: any;
  let tbeController: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;
  let mockToken: Contract;
  let omnibusWallet: string;

  beforeEach(async function() {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Deploy the TBE controller
    OmnibusTBEController = await ethers.getContractFactory("OmnibusTBEController");
    tbeController = await OmnibusTBEController.deploy();
    await tbeController.deployed();
    
    // Initialize the controller
    await tbeController.initialize();
    
    // Deploy mock token
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy();
    await mockToken.deployed();
    
    // Setup the omnibus wallet
    omnibusWallet = await addr3.getAddress();
    await tbeController.setOmnibusWallet(omnibusWallet);
    
    // Setup mock token behavior
    await mockToken.mock.transferFrom.returns(true);
  });

  describe("Basic Functionality", function() {
    it("Should initialize with correct state", async function() {
      expect(await tbeController.owner()).to.equal(await owner.getAddress());
      expect(await tbeController.getOmnibusWallet()).to.equal(omnibusWallet);
    });
    
    it("Should allow owner to change omnibus wallet", async function() {
      const newWallet = await addr2.getAddress();
      await tbeController.setOmnibusWallet(newWallet);
      expect(await tbeController.getOmnibusWallet()).to.equal(newWallet);
    });
    
    it("Should prevent non-owner from changing omnibus wallet", async function() {
      const newWallet = await addr2.getAddress();
      await expect(
        tbeController.connect(addr1).setOmnibusWallet(newWallet)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Token Transfer Functionality", function() {
    it("Should allow transfer from omnibus wallet", async function() {
      const amount = ethers.utils.parseEther("100");
      const recipient = await addr1.getAddress();
      
      await tbeController.transferFromOmnibus(mockToken.address, recipient, amount);
      
      // Verify the mock call was made correctly
      expect('transferFrom').to.be.calledOnContractWith(mockToken, [
        omnibusWallet, recipient, amount
      ]);
    });
    
    it("Should prevent transfers if omnibus wallet not set", async function() {
      // Set omnibus wallet to zero address
      await tbeController.setOmnibusWallet(ethers.constants.AddressZero);
      
      const amount = ethers.utils.parseEther("100");
      const recipient = await addr1.getAddress();
      
      await expect(
        tbeController.transferFromOmnibus(mockToken.address, recipient, amount)
      ).to.be.revertedWith("Omnibus wallet not set");
    });
    
    it("Should prevent non-owner from initiating transfers", async function() {
      const amount = ethers.utils.parseEther("100");
      const recipient = await addr1.getAddress();
      
      await expect(
        tbeController.connect(addr1).transferFromOmnibus(mockToken.address, recipient, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Batch Transfer Functionality", function() {
    it("Should process batch transfers from omnibus wallet", async function() {
      const amounts = [
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("20"),
        ethers.utils.parseEther("30")
      ];
      
      const recipients = [
        await addr1.getAddress(),
        await addr2.getAddress(),
        await owner.getAddress()
      ];
      
      await tbeController.batchTransferFromOmnibus(mockToken.address, recipients, amounts);
      
      // Verify multiple transferFrom calls were made
      for (let i = 0; i < recipients.length; i++) {
        expect('transferFrom').to.be.calledOnContractWith(mockToken, [
          omnibusWallet, recipients[i], amounts[i]
        ]);
      }
    });
    
    it("Should require recipients and amounts arrays to have same length", async function() {
      const amounts = [
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("20")
      ];
      
      const recipients = [
        await addr1.getAddress()
      ];
      
      await expect(
        tbeController.batchTransferFromOmnibus(mockToken.address, recipients, amounts)
      ).to.be.revertedWith("Recipients and amounts arrays must have same length");
    });
  });

  describe("Data Storage", function() {
    it("Should track token balances in omnibus wallet", async function() {
      // Set a balance for a token
      const tokenBalance = ethers.utils.parseEther("1000");
      await tbeController.setOmnibusTokenBalance(mockToken.address, tokenBalance);
      
      expect(await tbeController.getOmnibusTokenBalance(mockToken.address))
        .to.equal(tokenBalance);
    });
    
    it("Should allow updating token balances", async function() {
      // Set initial balance
      const initialBalance = ethers.utils.parseEther("1000");
      await tbeController.setOmnibusTokenBalance(mockToken.address, initialBalance);
      
      // Update to new balance
      const newBalance = ethers.utils.parseEther("1500");
      await tbeController.setOmnibusTokenBalance(mockToken.address, newBalance);
      
      expect(await tbeController.getOmnibusTokenBalance(mockToken.address))
        .to.equal(newBalance);
    });
    
    it("Should track beneficial owners for tokens", async function() {
      const investor = await addr1.getAddress();
      const amount = ethers.utils.parseEther("500");
      
      // Set beneficial ownership
      await tbeController.setBeneficialOwnership(
        mockToken.address, 
        investor, 
        amount
      );
      
      // Check the recorded ownership
      expect(await tbeController.getBeneficialOwnership(mockToken.address, investor))
        .to.equal(amount);
    });
    
    it("Should track total beneficial ownership for tokens", async function() {
      const investors = [
        await addr1.getAddress(),
        await addr2.getAddress()
      ];
      
      const amounts = [
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("300")
      ];
      
      // Set beneficial ownership for multiple investors
      for (let i = 0; i < investors.length; i++) {
        await tbeController.setBeneficialOwnership(
          mockToken.address,
          investors[i],
          amounts[i]
        );
      }
      
      // Total should be sum of all beneficial ownerships
      const expectedTotal = amounts[0].add(amounts[1]);
      expect(await tbeController.getTotalBeneficialOwnership(mockToken.address))
        .to.equal(expectedTotal);
    });
  });
});