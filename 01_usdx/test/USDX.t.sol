// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {USDX} from "../src/USDX.sol";

contract USDXTest is Test {
    USDX public usdx;
    address public deployer;
    address public user1;
    address public user2;

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy the USDX contract
        usdx = new USDX("USD Extended", "USDX");
        
        // Mint some tokens to users for testing
        usdx.mint(user1, 1000 * 10**18);
        usdx.mint(user2, 500 * 10**18);
    }

    function testInitialState() public {
        assertEq(usdx.name(), "USD Extended");
        assertEq(usdx.symbol(), "USDX");
        assertEq(usdx.decimals(), 18);
        assertEq(usdx.rewardMultiplier(), 100);
    }

    function testMinting() public {
        uint256 initialSupply = usdx.totalSupply();
        uint256 mintAmount = 100 * 10**18;
        
        usdx.mint(user1, mintAmount);
        
        assertEq(usdx.totalSupply(), initialSupply + mintAmount);
        assertEq(usdx.balanceOf(user1), 1000 * 10**18 + mintAmount);
    }

    function testBurning() public {
        uint256 initialSupply = usdx.totalSupply();
        uint256 burnAmount = 100 * 10**18;
        
        usdx.burn(user1, burnAmount);
        
        assertEq(usdx.totalSupply(), initialSupply - burnAmount);
        assertEq(usdx.balanceOf(user1), 1000 * 10**18 - burnAmount);
    }

    function testTransfer() public {
        uint256 transferAmount = 100 * 10**18;
        
        // Switch to user1
        vm.startPrank(user1);
        
        // Initial balances
        uint256 user1InitialBalance = usdx.balanceOf(user1);
        uint256 user2InitialBalance = usdx.balanceOf(user2);
        
        // Transfer tokens
        usdx.transfer(user2, transferAmount);
        
        // Assert new balances
        assertEq(usdx.balanceOf(user1), user1InitialBalance - transferAmount);
        assertEq(usdx.balanceOf(user2), user2InitialBalance + transferAmount);
        
        vm.stopPrank();
    }

    function testRewardMultiplier() public {
        // Initial reward multiplier should be 100 (1.00x)
        assertEq(usdx.rewardMultiplier(), 100);
        
        // Update the reward multiplier
        usdx.setRewardMultiplier(150);
        assertEq(usdx.rewardMultiplier(), 150);
        
        // Add to the reward multiplier
        usdx.addRewardMultiplier(50);
        assertEq(usdx.rewardMultiplier(), 200);
    }

    function testBlocklisting() public {
        // Create an array of addresses to block
        address[] memory blockedAddresses = new address[](1);
        blockedAddresses[0] = user1;
        
        // Block user1
        usdx.blockAccounts(blockedAddresses);
        
        // Check if user1 is blocked
        assertTrue(usdx.isBlocked(user1));
        
        // User1 should not be able to transfer tokens
        vm.startPrank(user1);
        vm.expectRevert("USDX: account is blocked");
        usdx.transfer(user2, 10 * 10**18);
        vm.stopPrank();
        
        // Unblock user1
        usdx.unblockAccounts(blockedAddresses);
        
        // Check if user1 is unblocked
        assertFalse(usdx.isBlocked(user1));
        
        // User1 should now be able to transfer tokens
        vm.startPrank(user1);
        usdx.transfer(user2, 10 * 10**18);
        vm.stopPrank();
    }

    function testPausing() public {
        // Initially not paused
        assertFalse(usdx.paused());
        
        // Pause the contract
        usdx.pause();
        assertTrue(usdx.paused());
        
        // Transfers should fail when paused
        vm.startPrank(user1);
        vm.expectRevert("Pausable: paused");
        usdx.transfer(user2, 10 * 10**18);
        vm.stopPrank();
        
        // Unpause the contract
        usdx.unpause();
        assertFalse(usdx.paused());
        
        // Transfers should work when unpaused
        vm.startPrank(user1);
        usdx.transfer(user2, 10 * 10**18);
        vm.stopPrank();
    }

    function testShares() public {
        // Check initial shares
        uint256 initialUser1Shares = usdx.sharesOf(user1);
        
        // When reward multiplier is 100 (1.00x), shares = tokens
        assertEq(initialUser1Shares, 1000 * 10**18);
        
        // Change reward multiplier to 200 (2.00x)
        usdx.setRewardMultiplier(200);
        
        // Mint more tokens to user1
        uint256 mintAmount = 1000 * 10**18;
        usdx.mint(user1, mintAmount);
        
        // New shares should be calculated with new multiplier
        // Initial shares + (new tokens * 100 / 200)
        uint256 expectedShares = initialUser1Shares + (mintAmount * 100 / 200);
        assertEq(usdx.sharesOf(user1), expectedShares);
    }
}