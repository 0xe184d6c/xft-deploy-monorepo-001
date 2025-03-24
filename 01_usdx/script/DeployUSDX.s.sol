// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {USDX} from "../src/USDX.sol";

contract DeployUSDX is Script {
    function run() external returns (USDX) {
        // Retrieve private key from environment variables for deployment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy USDX contract
        USDX usdx = new USDX("USD Extended", "USDX");
        
        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        // Return the deployed contract
        return usdx;
    }
}