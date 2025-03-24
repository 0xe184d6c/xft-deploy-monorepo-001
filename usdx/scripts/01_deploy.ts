import { ethers, upgrades, run, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  // Token configuration
  const tokenName = "XFT Digital Dollar";
  const tokenSymbol = "USDX";
  const ownerAddress = "0x2f572059DbC598C8acfeA4AF06FE4f7669D1b3b1";

  // Deployment configuration
  const waitConfirmations = 6;  // For Sepolia
  const deploymentDir = "./deployments";

  console.log("==========================================");
  console.log(`USDX DEPLOYMENT - ${network.name.toUpperCase()}`);
  console.log("==========================================");

  // Validate owner address
  if (!ethers.utils.isAddress(ownerAddress)) {
    throw new Error(`Invalid owner address: ${ownerAddress}`);
  }

  // Get deployer information
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
  console.log(`Token Name: ${tokenName}`);
  console.log(`Token Symbol: ${tokenSymbol}`);
  console.log(`Owner Address: ${ownerAddress}`);

  // Check for sufficient balance (Sepolia deployment costs)
  if (balance.lt(ethers.utils.parseEther("0.005"))) {
    console.error("WARNING: Low deployer balance - deployment may fail");
    console.error("Recommended minimum: 0.005 ETH for Sepolia");
  }

  try {
    console.log("\nSTEP 1: Deploying USDX proxy contract...");

    // Get contract factory
    const USDX = await ethers.getContractFactory("USDX");

    // Deploy the contract with proxy
    const startTime = Date.now();
    const usdxProxy = await upgrades.deployProxy(
      USDX, 
      [tokenName, tokenSymbol, ownerAddress], 
      { 
        kind: "uups",
        initializer: "initialize"
      }
    );

    // Wait for deployment to complete
    await usdxProxy.deployed();
    const deployTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Get implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(usdxProxy.address);

    console.log(`Deployment successful in ${deployTime}s`);
    console.log(`Proxy Address: ${usdxProxy.address}`);
    console.log(`Implementation Address: ${implementationAddress}`);
    console.log(`Transaction Hash: ${usdxProxy.deployTransaction.hash}`);

    // Save deployment information
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const deploymentPath = path.join(deploymentDir, `usdx-${network.name}-${timestamp}.json`);

    const deploymentData = {
      network: network.name,
      chainId: network.config.chainId,
      token: {
        name: tokenName,
        symbol: tokenSymbol,
        owner: ownerAddress
      },
      addresses: {
        proxy: usdxProxy.address,
        implementation: implementationAddress
      },
      transaction: usdxProxy.deployTransaction.hash,
      timestamp: new Date().toISOString(),
      deployer: deployer.address
    };

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log(`Deployment data saved to ${deploymentPath}`);

    // Verify contract on Etherscan
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\nSTEP 2: Verifying contract on Etherscan...");
      console.log(`Waiting for ${waitConfirmations} block confirmations...`);

      // Wait for confirmations
      const receipt = await usdxProxy.deployTransaction.wait(waitConfirmations);
      console.log(`Received ${receipt.confirmations} confirmations`);

      try {
        console.log("Submitting verification request...");

        // Verify the implementation contract
        await run("verify:verify", {
          address: implementationAddress,
          constructorArguments: [],
        });

        console.log("Contract verification successful");
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          console.log("Contract already verified");
        } else {
          console.warn("Contract verification failed:", error.message);
          console.log("You can try manual verification later");
        }
      }
    }

    // Validate deployment
    console.log("\nSTEP 3: Validating deployment...");
    const usdx = await ethers.getContractAt("USDX", usdxProxy.address);

    const contractName = await usdx.name();
    const contractSymbol = await usdx.symbol();
    const DEFAULT_ADMIN_ROLE = await usdx.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await usdx.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress);

    console.log(`Contract name: ${contractName}`);
    console.log(`Contract symbol: ${contractSymbol}`);
    console.log(`Owner has admin role: ${hasAdminRole}`);

    if (contractName !== tokenName || contractSymbol !== tokenSymbol || !hasAdminRole) {
      console.warn("WARNING: Deployment validation found issues");
      if (contractName !== tokenName) console.warn(`- Name mismatch: ${contractName} vs ${tokenName}`);
      if (contractSymbol !== tokenSymbol) console.warn(`- Symbol mismatch: ${contractSymbol} vs ${tokenSymbol}`);
      if (!hasAdminRole) console.warn(`- Owner does not have admin role`);
    } else {
      console.log("Deployment validation successful");
    }

    // Deployment summary
    console.log("\n==========================================");
    console.log("DEPLOYMENT SUMMARY");
    console.log("==========================================");
    console.log(`Network: ${network.name} (ChainId: ${network.config.chainId})`);
    console.log(`Token Name: ${tokenName}`);
    console.log(`Token Symbol: ${tokenSymbol}`);
    console.log(`Proxy Address: ${usdxProxy.address}`);
    console.log(`Implementation Address: ${implementationAddress}`);
    console.log(`Owner (Admin): ${ownerAddress}`);
    console.log(`Deployed by: ${deployer.address}`);
    console.log("\nNext steps:");
    console.log("1. Grant roles to appropriate addresses:");
    console.log(`   - MINTER_ROLE to allow minting tokens`);
    console.log(`   - BURNER_ROLE to allow burning tokens`);
    console.log(`   - ORACLE_ROLE to manage reward multiplier`);
    console.log(`   - UPGRADE_ROLE for future upgrades`);
    console.log("2. Mint initial tokens to desired recipients");
    console.log("==========================================");

    return deploymentData;

  } catch (error: any) {
    console.error("\n==========================================");
    console.error("DEPLOYMENT FAILED");
    console.error("==========================================");

    // Provide more context for common deployment errors
    if (error.message.includes("insufficient funds")) {
      console.error("Error: Insufficient funds in deployer account");
      console.error("Make sure your account has enough ETH for deployment and gas fees");
    } else if (error.message.includes("nonce")) {
      console.error("Error: Transaction nonce issue");
      console.error("You might have pending transactions from this account");
    } else if (error.message.includes("gas")) {
      console.error("Error: Gas estimation or limit issue");
      console.error("The transaction might be too complex or network congested");
    } else {
      console.error(`Error: ${error.message}`);
    }

    throw error;
  }
}

// Run deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });