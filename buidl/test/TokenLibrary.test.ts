import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("TokenLibrary", function() {
  let TokenLibrary: any;
  let tokenLibrary: Contract;
  let TestTokenLibrary: any;
  let testContract: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy TokenLibrary
    TokenLibrary = await ethers.getContractFactory("TokenLibrary");
    tokenLibrary = await TokenLibrary.deploy();
    await tokenLibrary.deployed();
    
    // Deploy a test contract that uses the TokenLibrary
    TestTokenLibrary = await ethers.getContractFactory("TestTokenLibrary", {
      libraries: {
        TokenLibrary: tokenLibrary.address
      }
    });
    testContract = await TestTokenLibrary.deploy();
    await testContract.deployed();
  });

  describe("Metadata Management", function() {
    it("Should set and get token metadata correctly", async function() {
      const name = "Test Token";
      const symbol = "TST";
      const decimals = 18;
      
      await testContract.setTokenMetadata(name, symbol, decimals);
      
      expect(await testContract.getName()).to.equal(name);
      expect(await testContract.getSymbol()).to.equal(symbol);
      expect(await testContract.getDecimals()).to.equal(decimals);
    });
    
    it("Should not allow changing metadata once set", async function() {
      const name = "Test Token";
      const symbol = "TST";
      const decimals = 18;
      
      await testContract.setTokenMetadata(name, symbol, decimals);
      
      // Attempt to change metadata should fail
      await expect(
        testContract.setTokenMetadata("New Name", "NEW", 6)
      ).to.be.revertedWith("Token metadata already set");
    });
  });

  describe("Balance Management", function() {
    it("Should set and get wallet balances correctly", async function() {
      const addr = await addr1.getAddress();
      const amount = ethers.utils.parseEther("100");
      
      await testContract.setWalletBalance(addr, amount);
      
      expect(await testContract.getWalletBalance(addr)).to.equal(amount);
    });
    
    it("Should update wallet balances correctly", async function() {
      const addr = await addr1.getAddress();
      const initialAmount = ethers.utils.parseEther("100");
      const additionalAmount = ethers.utils.parseEther("50");
      
      // Set initial balance
      await testContract.setWalletBalance(addr, initialAmount);
      
      // Add more tokens
      await testContract.addToWalletBalance(addr, additionalAmount);
      
      // Should be the sum
      expect(await testContract.getWalletBalance(addr))
        .to.equal(initialAmount.add(additionalAmount));
    });
    
    it("Should correctly subtract from wallet balances", async function() {
      const addr = await addr1.getAddress();
      const initialAmount = ethers.utils.parseEther("100");
      const subtractAmount = ethers.utils.parseEther("30");
      
      // Set initial balance
      await testContract.setWalletBalance(addr, initialAmount);
      
      // Subtract tokens
      await testContract.subtractFromWalletBalance(addr, subtractAmount);
      
      // Should be the difference
      expect(await testContract.getWalletBalance(addr))
        .to.equal(initialAmount.sub(subtractAmount));
    });
    
    it("Should revert when subtracting more than available balance", async function() {
      const addr = await addr1.getAddress();
      const initialAmount = ethers.utils.parseEther("100");
      const subtractAmount = ethers.utils.parseEther("150");
      
      // Set initial balance
      await testContract.setWalletBalance(addr, initialAmount);
      
      // Attempt to subtract more than available should fail
      await expect(
        testContract.subtractFromWalletBalance(addr, subtractAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Total Supply Management", function() {
    it("Should track total supply correctly", async function() {
      expect(await testContract.getTotalSupply()).to.equal(0);
      
      // Add to total supply
      const amount = ethers.utils.parseEther("1000");
      await testContract.addToTotalSupply(amount);
      
      expect(await testContract.getTotalSupply()).to.equal(amount);
    });
    
    it("Should subtract from total supply correctly", async function() {
      // Add to total supply first
      const initialAmount = ethers.utils.parseEther("1000");
      await testContract.addToTotalSupply(initialAmount);
      
      // Subtract from total supply
      const subtractAmount = ethers.utils.parseEther("300");
      await testContract.subtractFromTotalSupply(subtractAmount);
      
      expect(await testContract.getTotalSupply())
        .to.equal(initialAmount.sub(subtractAmount));
    });
    
    it("Should revert when subtracting more than total supply", async function() {
      // Add to total supply first
      const initialAmount = ethers.utils.parseEther("1000");
      await testContract.addToTotalSupply(initialAmount);
      
      // Attempt to subtract more than total supply
      const subtractAmount = ethers.utils.parseEther("1200");
      
      await expect(
        testContract.subtractFromTotalSupply(subtractAmount)
      ).to.be.revertedWith("Insufficient total supply");
    });
  });

  describe("Transfer Helper Functions", function() {
    it("Should handle basic transfer between wallets", async function() {
      const sender = await owner.getAddress();
      const recipient = await addr1.getAddress();
      const amount = ethers.utils.parseEther("50");
      
      // Setup initial balance for sender
      await testContract.setWalletBalance(sender, ethers.utils.parseEther("100"));
      
      // Perform transfer
      await testContract.executeTransfer(sender, recipient, amount);
      
      // Check balances
      expect(await testContract.getWalletBalance(sender))
        .to.equal(ethers.utils.parseEther("50"));
      expect(await testContract.getWalletBalance(recipient))
        .to.equal(amount);
    });
    
    it("Should revert transfer if sender has insufficient balance", async function() {
      const sender = await owner.getAddress();
      const recipient = await addr1.getAddress();
      const amount = ethers.utils.parseEther("150");
      
      // Setup initial balance for sender
      await testContract.setWalletBalance(sender, ethers.utils.parseEther("100"));
      
      // Attempt transfer with insufficient funds
      await expect(
        testContract.executeTransfer(sender, recipient, amount)
      ).to.be.revertedWith("Insufficient balance");
    });
    
    it("Should handle mint operation correctly", async function() {
      const recipient = await addr1.getAddress();
      const amount = ethers.utils.parseEther("100");
      
      // Execute mint
      await testContract.executeMint(recipient, amount);
      
      // Check recipient balance and total supply
      expect(await testContract.getWalletBalance(recipient)).to.equal(amount);
      expect(await testContract.getTotalSupply()).to.equal(amount);
    });
    
    it("Should handle burn operation correctly", async function() {
      const holder = await addr1.getAddress();
      const amount = ethers.utils.parseEther("50");
      
      // Setup initial state - mint tokens to holder
      await testContract.executeMint(holder, ethers.utils.parseEther("100"));
      
      // Execute burn
      await testContract.executeBurn(holder, amount);
      
      // Check holder balance and total supply
      expect(await testContract.getWalletBalance(holder))
        .to.equal(ethers.utils.parseEther("50"));
      expect(await testContract.getTotalSupply())
        .to.equal(ethers.utils.parseEther("50"));
    });
  });
});