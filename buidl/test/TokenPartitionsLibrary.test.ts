import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("TokenPartitionsLibrary", function() {
  let TokenPartitionsLibrary: any;
  let tokenPartitionsLibrary: Contract;
  let TestTokenPartitions: any;
  let testContract: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let partition1: string;
  let partition2: string;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy TokenPartitionsLibrary
    TokenPartitionsLibrary = await ethers.getContractFactory("TokenPartitionsLibrary");
    tokenPartitionsLibrary = await TokenPartitionsLibrary.deploy();
    await tokenPartitionsLibrary.deployed();
    
    // Deploy a test contract that uses the TokenPartitionsLibrary
    TestTokenPartitions = await ethers.getContractFactory("TestTokenPartitions", {
      libraries: {
        TokenPartitionsLibrary: tokenPartitionsLibrary.address
      }
    });
    testContract = await TestTokenPartitions.deploy();
    await testContract.deployed();
    
    // Define partition names for testing
    partition1 = ethers.utils.formatBytes32String("PARTITION1");
    partition2 = ethers.utils.formatBytes32String("PARTITION2");
  });

  describe("Partition Management", function() {
    it("Should add partitions correctly", async function() {
      await testContract.addPartition(partition1);
      
      expect(await testContract.isPartitionExists(partition1)).to.be.true;
      expect(await testContract.getPartitionsCount()).to.equal(1);
    });
    
    it("Should add multiple partitions correctly", async function() {
      await testContract.addPartition(partition1);
      await testContract.addPartition(partition2);
      
      expect(await testContract.isPartitionExists(partition1)).to.be.true;
      expect(await testContract.isPartitionExists(partition2)).to.be.true;
      expect(await testContract.getPartitionsCount()).to.equal(2);
    });
    
    it("Should retrieve partitions by index", async function() {
      await testContract.addPartition(partition1);
      await testContract.addPartition(partition2);
      
      expect(await testContract.getPartitionByIndex(0)).to.equal(partition1);
      expect(await testContract.getPartitionByIndex(1)).to.equal(partition2);
    });
    
    it("Should not add duplicate partitions", async function() {
      await testContract.addPartition(partition1);
      await testContract.addPartition(partition1); // Should be ignored
      
      expect(await testContract.getPartitionsCount()).to.equal(1);
    });
  });

  describe("Balances in Partitions", function() {
    it("Should set and get balances in partitions correctly", async function() {
      const user = await addr1.getAddress();
      const amount1 = ethers.utils.parseEther("100");
      const amount2 = ethers.utils.parseEther("200");
      
      // Add partitions
      await testContract.addPartition(partition1);
      await testContract.addPartition(partition2);
      
      // Set balances
      await testContract.setBalanceOfByPartition(user, partition1, amount1);
      await testContract.setBalanceOfByPartition(user, partition2, amount2);
      
      // Verify balances
      expect(await testContract.balanceOfByPartition(user, partition1)).to.equal(amount1);
      expect(await testContract.balanceOfByPartition(user, partition2)).to.equal(amount2);
      
      // Total balance across partitions
      expect(await testContract.balanceOf(user)).to.equal(amount1.add(amount2));
    });
    
    it("Should update balances in partitions correctly", async function() {
      const user = await addr1.getAddress();
      const initialAmount = ethers.utils.parseEther("100");
      const addAmount = ethers.utils.parseEther("50");
      
      // Add partition
      await testContract.addPartition(partition1);
      
      // Set initial balance
      await testContract.setBalanceOfByPartition(user, partition1, initialAmount);
      
      // Add to balance
      await testContract.addToBalanceOfByPartition(user, partition1, addAmount);
      
      // Verify updated balance
      expect(await testContract.balanceOfByPartition(user, partition1))
        .to.equal(initialAmount.add(addAmount));
    });
    
    it("Should subtract from balances in partitions correctly", async function() {
      const user = await addr1.getAddress();
      const initialAmount = ethers.utils.parseEther("100");
      const subtractAmount = ethers.utils.parseEther("30");
      
      // Add partition
      await testContract.addPartition(partition1);
      
      // Set initial balance
      await testContract.setBalanceOfByPartition(user, partition1, initialAmount);
      
      // Subtract from balance
      await testContract.subtractFromBalanceOfByPartition(user, partition1, subtractAmount);
      
      // Verify updated balance
      expect(await testContract.balanceOfByPartition(user, partition1))
        .to.equal(initialAmount.sub(subtractAmount));
    });
    
    it("Should revert when subtracting more than available in partition", async function() {
      const user = await addr1.getAddress();
      const initialAmount = ethers.utils.parseEther("100");
      const subtractAmount = ethers.utils.parseEther("150");
      
      // Add partition
      await testContract.addPartition(partition1);
      
      // Set initial balance
      await testContract.setBalanceOfByPartition(user, partition1, initialAmount);
      
      // Should fail with insufficient balance
      await expect(
        testContract.subtractFromBalanceOfByPartition(user, partition1, subtractAmount)
      ).to.be.revertedWith("Insufficient balance in partition");
    });
  });

  describe("Total Supply in Partitions", function() {
    it("Should track total supply by partition correctly", async function() {
      const amount1 = ethers.utils.parseEther("300");
      const amount2 = ethers.utils.parseEther("500");
      
      // Add partitions
      await testContract.addPartition(partition1);
      await testContract.addPartition(partition2);
      
      // Add to total supply
      await testContract.addToTotalSupplyByPartition(partition1, amount1);
      await testContract.addToTotalSupplyByPartition(partition2, amount2);
      
      // Verify partition supplies
      expect(await testContract.totalSupplyByPartition(partition1)).to.equal(amount1);
      expect(await testContract.totalSupplyByPartition(partition2)).to.equal(amount2);
      
      // Total supply across all partitions
      expect(await testContract.totalSupply()).to.equal(amount1.add(amount2));
    });
    
    it("Should subtract from total supply by partition correctly", async function() {
      const initialAmount = ethers.utils.parseEther("500");
      const subtractAmount = ethers.utils.parseEther("200");
      
      // Add partition
      await testContract.addPartition(partition1);
      
      // Set initial supply
      await testContract.addToTotalSupplyByPartition(partition1, initialAmount);
      
      // Subtract from supply
      await testContract.subtractFromTotalSupplyByPartition(partition1, subtractAmount);
      
      // Verify updated supply
      expect(await testContract.totalSupplyByPartition(partition1))
        .to.equal(initialAmount.sub(subtractAmount));
    });
    
    it("Should revert when subtracting more than available in partition supply", async function() {
      const initialAmount = ethers.utils.parseEther("100");
      const subtractAmount = ethers.utils.parseEther("150");
      
      // Add partition
      await testContract.addPartition(partition1);
      
      // Set initial supply
      await testContract.addToTotalSupplyByPartition(partition1, initialAmount);
      
      // Should fail with insufficient supply
      await expect(
        testContract.subtractFromTotalSupplyByPartition(partition1, subtractAmount)
      ).to.be.revertedWith("Insufficient total supply in partition");
    });
  });

  describe("Token Operations in Partitions", function() {
    it("Should handle transfer between partitions correctly", async function() {
      const sender = await owner.getAddress();
      const recipient = await addr1.getAddress();
      const amount = ethers.utils.parseEther("50");
      
      // Add partitions
      await testContract.addPartition(partition1);
      
      // Setup initial balances
      await testContract.setBalanceOfByPartition(sender, partition1, ethers.utils.parseEther("100"));
      
      // Perform transfer
      await testContract.transferByPartition(sender, recipient, partition1, amount);
      
      // Verify balances
      expect(await testContract.balanceOfByPartition(sender, partition1))
        .to.equal(ethers.utils.parseEther("50"));
      expect(await testContract.balanceOfByPartition(recipient, partition1))
        .to.equal(amount);
    });
    
    it("Should handle mint to partition correctly", async function() {
      const recipient = await addr1.getAddress();
      const amount = ethers.utils.parseEther("100");
      
      // Add partition
      await testContract.addPartition(partition1);
      
      // Mint to partition
      await testContract.mintByPartition(recipient, partition1, amount);
      
      // Verify recipient balance and total supply
      expect(await testContract.balanceOfByPartition(recipient, partition1)).to.equal(amount);
      expect(await testContract.totalSupplyByPartition(partition1)).to.equal(amount);
      expect(await testContract.balanceOf(recipient)).to.equal(amount);
      expect(await testContract.totalSupply()).to.equal(amount);
    });
    
    it("Should handle burn from partition correctly", async function() {
      const holder = await addr1.getAddress();
      const initialAmount = ethers.utils.parseEther("100");
      const burnAmount = ethers.utils.parseEther("30");
      
      // Add partition
      await testContract.addPartition(partition1);
      
      // Setup initial state - mint to partition
      await testContract.mintByPartition(holder, partition1, initialAmount);
      
      // Burn from partition
      await testContract.burnByPartition(holder, partition1, burnAmount);
      
      // Verify updated state
      expect(await testContract.balanceOfByPartition(holder, partition1))
        .to.equal(initialAmount.sub(burnAmount));
      expect(await testContract.totalSupplyByPartition(partition1))
        .to.equal(initialAmount.sub(burnAmount));
      expect(await testContract.balanceOf(holder))
        .to.equal(initialAmount.sub(burnAmount));
      expect(await testContract.totalSupply())
        .to.equal(initialAmount.sub(burnAmount));
    });
    
    it("Should handle transfers between different partitions", async function() {
      const holder = await addr1.getAddress();
      const partition1Amount = ethers.utils.parseEther("80");
      const partition2Amount = ethers.utils.parseEther("120");
      const transferAmount = ethers.utils.parseEther("30");
      
      // Add partitions
      await testContract.addPartition(partition1);
      await testContract.addPartition(partition2);
      
      // Setup initial balances
      await testContract.mintByPartition(holder, partition1, partition1Amount);
      await testContract.mintByPartition(holder, partition2, partition2Amount);
      
      // Transfer between partitions (p1 -> p2)
      await testContract.transferBetweenPartitions(
        holder,
        partition1,
        partition2,
        transferAmount
      );
      
      // Verify updated balances
      expect(await testContract.balanceOfByPartition(holder, partition1))
        .to.equal(partition1Amount.sub(transferAmount));
      expect(await testContract.balanceOfByPartition(holder, partition2))
        .to.equal(partition2Amount.add(transferAmount));
      
      // Total balance should remain unchanged
      expect(await testContract.balanceOf(holder))
        .to.equal(partition1Amount.add(partition2Amount));
    });
  });
});