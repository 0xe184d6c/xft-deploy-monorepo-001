import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

// Configuration for specific addresses to be assigned roles (besides owner)
interface RoleSpecialAssignment {
  [role: string]: string[]; // Maps role name to array of addresses
}

async function main() {
  console.log("==========================================");
  console.log(`USDX ROLE ASSIGNMENT - ${network.name.toUpperCase()}`);
  console.log("==========================================");

  // Get deployer information
  const [deployer] = await ethers.getSigners();
  console.log(`Connected with: ${deployer.address}`);

  // Find the latest deployment file
  const deploymentDir = "./deployments";
  const deploymentFiles = fs.readdirSync(deploymentDir)
    .filter(file => file.startsWith(`usdx-${network.name}`))
    .sort((a, b) => {
      // Sort by timestamp (descending)
      const timeA = a.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)?.[0] || "";
      const timeB = b.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)?.[0] || "";
      return timeB.localeCompare(timeA);
    });

  if (deploymentFiles.length === 0) {
    throw new Error(`No deployments found for network ${network.name}. Deploy USDX first using the 01_deploy.ts script.`);
  }

  const latestDeployment = deploymentFiles[0];
  const deploymentPath = path.join(deploymentDir, latestDeployment);
  
  console.log(`Loading deployment from: ${latestDeployment}`);
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Connect to the deployed USDX contract
  const usdxAddress = deploymentData.addresses.proxy;
  console.log(`Connecting to USDX at: ${usdxAddress}`);
  const usdx = await ethers.getContractAt("USDX", usdxAddress);

  // Get owner address from deployment data
  const ownerAddress = deploymentData.token.owner;
  console.log(`Owner address: ${ownerAddress}`);
  
  // Check if DEFAULT_ADMIN_ROLE is already assigned to the owner
  const DEFAULT_ADMIN_ROLE = await usdx.DEFAULT_ADMIN_ROLE();
  const ownerHasAdminRole = await usdx.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress);
  
  console.log(`\nVerifying DEFAULT_ADMIN_ROLE for ${ownerAddress}:`);
  console.log(`- Has admin role: ${ownerHasAdminRole}`);
  
  if (!ownerHasAdminRole) {
    throw new Error(`Owner address ${ownerAddress} does not have DEFAULT_ADMIN_ROLE. Cannot proceed with role assignments.`);
  }

  // Special role assignments - Add additional addresses for specific roles here if needed
  // This object defines additional addresses (beyond the owner) that should receive each role
  // Leave the array empty if only the owner should have the role
  const specialRoleAssignments: RoleSpecialAssignment = {
    // Example: Add additional addresses for MINTER_ROLE (replace with actual addresses if needed)
    "MINTER_ROLE": [
      // "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" 
    ],
    // Example: Add additional addresses for BURNER_ROLE (replace with actual addresses if needed)
    "BURNER_ROLE": [
      // "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    ],
    // Example: Add additional addresses for ORACLE_ROLE (replace with actual addresses if needed)
    "ORACLE_ROLE": [
      // "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    ],
    // Example: Add additional addresses for PAUSE_ROLE (replace with actual addresses if needed)
    "PAUSE_ROLE": [
      // Additional addresses can be added here if needed
    ],
    // Example: Add additional addresses for BLOCKLIST_ROLE (replace with actual addresses if needed)
    "BLOCKLIST_ROLE": [
      // "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
    ],
    // Example: Add additional addresses for UPGRADE_ROLE (replace with actual addresses if needed)
    "UPGRADE_ROLE": [
      // Additional addresses can be added here if needed
    ]
  };

  // Get all available roles from the contract
  const roles = [
    { name: "MINTER_ROLE", constant: "MINTER_ROLE" },
    { name: "BURNER_ROLE", constant: "BURNER_ROLE" },
    { name: "ORACLE_ROLE", constant: "ORACLE_ROLE" },
    { name: "PAUSE_ROLE", constant: "PAUSE_ROLE" },
    { name: "BLOCKLIST_ROLE", constant: "BLOCKLIST_ROLE" },
    { name: "UPGRADE_ROLE", constant: "UPGRADE_ROLE" }
  ];

  console.log("\nAssigning roles...");

  // Process each role
  for (const role of roles) {
    try {
      // Get the role identifier
      const roleId = await usdx[role.constant]();
      console.log(`\nProcessing ${role.name} (${roleId}):`);
      
      // Create a list of addresses for this role (always include owner + any special assignments)
      const addressesForRole = [ownerAddress];
      
      // Add any additional addresses for this role
      if (specialRoleAssignments[role.constant] && specialRoleAssignments[role.constant].length > 0) {
        addressesForRole.push(...specialRoleAssignments[role.constant]);
      }
      
      // Remove duplicates
      const uniqueAddresses = [...new Set(addressesForRole)];
      
      // Grant the role to each address in the list
      for (const address of uniqueAddresses) {
        // Verify address is valid
        if (!ethers.utils.isAddress(address)) {
          console.warn(`- Invalid address format: ${address}, skipping`);
          continue;
        }
        
        // Check if role is already assigned
        const hasRole = await usdx.hasRole(roleId, address);
        
        if (hasRole) {
          console.log(`- ${address} already has ${role.name}`);
        } else {
          console.log(`- Granting ${role.name} to ${address}...`);
          try {
            // Grant the role
            const tx = await usdx.grantRole(roleId, address);
            await tx.wait();
            console.log(`  ✓ Transaction successful: ${tx.hash}`);
          } catch (error: any) {
            console.error(`  ✗ Failed to grant ${role.name} to ${address}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      console.error(`Error processing ${role.name}: ${error.message}`);
    }
  }

  // Verify all role assignments
  console.log("\n==========================================");
  console.log("ROLE ASSIGNMENT VERIFICATION");
  console.log("==========================================");
  
  for (const role of roles) {
    try {
      const roleId = await usdx[role.constant]();
      console.log(`\n${role.name}:`);
      
      // Always check owner
      const ownerHasRole = await usdx.hasRole(roleId, ownerAddress);
      console.log(`- ${ownerAddress} (Owner): ${ownerHasRole ? '✓' : '✗'}`);
      
      // Check any additional addresses
      if (specialRoleAssignments[role.constant]) {
        for (const address of specialRoleAssignments[role.constant]) {
          if (ethers.utils.isAddress(address)) {
            const hasRole = await usdx.hasRole(roleId, address);
            console.log(`- ${address}: ${hasRole ? '✓' : '✗'}`);
          }
        }
      }
    } catch (error: any) {
      console.error(`Error verifying ${role.name}: ${error.message}`);
    }
  }

  console.log("\n==========================================");
  console.log("ROLE ASSIGNMENT SUMMARY");
  console.log("==========================================");
  console.log(`Contract: ${usdxAddress}`);
  console.log(`Owner/Admin: ${ownerAddress}`);
  console.log(`Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log("\nCompleted role assignments. The contract is now ready for operation.");
  console.log("\nTo add more addresses to specific roles, update the specialRoleAssignments object in this script.");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });