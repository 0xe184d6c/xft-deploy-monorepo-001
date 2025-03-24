import { ethers, upgrades, run, network, artifacts } from "hardhat";
import fs from "fs";
import path from "path";

// Deployment configuration
const CONFIG = {
  token: {
    name: "XFT Digital Dollar",
    symbol: "USDX",
    owner: "0x2f572059DbC598C8acfeA4AF06FE4f7669D1b3b1",
  },
  deployment: {
    waitConfirmations: network.name === "mainnet" ? 8 : 6,
    skipVerification: process.env.SKIP_VERIFICATION === "true",
    gasLimit: undefined, // Auto-estimate
    artifactsDir: "./deployments",
    validateDeployment: true,
  }
};

async function main() {
  // Ensure owner address is valid
  if (!ethers.utils.isAddress(CONFIG.token.owner)) {
    throw new Error(`Invalid owner address: ${CONFIG.token.owner}`);
  }

  // Check network compatibility
  if (network.name === "mainnet") {
    // Prompt for confirmation if mainnet
    console.warn("\n⚠️  WARNING: You are deploying to MAINNET ⚠️\n");
    // In production you might add a confirmation prompt here
  }

  console.log(`📄 Deploying USDX to ${network.name}...`);

  try {
    // Get deployer address and balance
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.getBalance();

    console.log(`🔑 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);

    if (balance.lt(ethers.utils.parseEther("0.01"))) {
      throw new Error(`Insufficient balance for deployment`);
    }

    // Get contract factory
    const USDX = await ethers.getContractFactory("USDX");

    // Deploy with proxy
    console.log("Deploying proxy...");
    const usdxProxy = await upgrades.deployProxy(
      USDX,
      [CONFIG.token.name, CONFIG.token.symbol, CONFIG.token.owner],
      {
        kind: "uups",
        initializer: "initialize",
        gasLimit: CONFIG.deployment.gasLimit,
      }
    );

    // Wait for deployment
    await usdxProxy.deployed();
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(usdxProxy.address);

    console.log(`✅ USDX proxy deployed to: ${usdxProxy.address}`);
    console.log(`📝 Implementation: ${implementationAddress}`);

    // Create artifacts directory if it doesn't exist
    if (!fs.existsSync(CONFIG.deployment.artifactsDir)) {
      fs.mkdirSync(CONFIG.deployment.artifactsDir, { recursive: true });
    }

    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      chainId: network.config.chainId,
      token: CONFIG.token,
      addresses: {
        proxy: usdxProxy.address,
        implementation: implementationAddress,
        admin: CONFIG.token.owner,
      },
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      txHash: usdxProxy.deployTransaction.hash,
    };

    const deploymentPath = path.join(
      CONFIG.deployment.artifactsDir,
      `usdx-${network.name}-${new Date().toISOString().split('T')[0]}.json`
    );

    fs.writeFileSync(
      deploymentPath,
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`📋 Deployment info saved to ${deploymentPath}`);

    // Verify contract if on a public network
    if (!CONFIG.deployment.skipVerification && 
        network.name !== "hardhat" && 
        network.name !== "localhost") {

      console.log(`⏳ Waiting for ${CONFIG.deployment.waitConfirmations} confirmations...`);
      await usdxProxy.deployTransaction.wait(CONFIG.deployment.waitConfirmations);

      try {
        console.log("🔍 Verifying implementation contract...");
        await run("verify:verify", {
          address: implementationAddress,
          constructorArguments: [],
        });
        console.log("✅ Contract verified successfully");
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          console.log("✅ Contract already verified");
        } else {
          console.error("❌ Verification failed:", error.message);
        }
      }
    }

    // Post-deployment validation
    if (CONFIG.deployment.validateDeployment) {
      console.log("🔎 Validating deployment...");

      const usdx = await ethers.getContractAt("USDX", usdxProxy.address);

      // Basic contract checks
      const contractName = await usdx.name();
      const contractSymbol = await usdx.symbol();
      const adminRole = await usdx.DEFAULT_ADMIN_ROLE();
      const hasAdminRole = await usdx.hasRole(adminRole, CONFIG.token.owner);

      if (contractName !== CONFIG.token.name || 
          contractSymbol !== CONFIG.token.symbol || 
          !hasAdminRole) {
        console.warn("⚠️ Deployment validation found issues:");
        if (contractName !== CONFIG.token.name)
          console.warn(`- Name mismatch: ${contractName} vs ${CONFIG.token.name}`);
        if (contractSymbol !== CONFIG.token.symbol)
          console.warn(`- Symbol mismatch: ${contractSymbol} vs ${CONFIG.token.symbol}`);
        if (!hasAdminRole)
          console.warn(`- Owner does not have admin role`);
      } else {
        console.log("✅ Deployment validation successful");
      }
    }

    // Final deployment summary
    console.log("\n==========================================");
    console.log("DEPLOYMENT SUMMARY");
    console.log("==========================================");
    console.log(`Token Name: ${CONFIG.token.name}`);
    console.log(`Token Symbol: ${CONFIG.token.symbol}`);
    console.log(`Network: ${network.name}`);
    console.log(`Proxy: ${usdxProxy.address}`);
    console.log(`Implementation: ${implementationAddress}`);
    console.log(`Owner: ${CONFIG.token.owner}`);
    console.log("==========================================");

    return deploymentInfo;

  } catch (error: any) {
    console.error(`❌ Deployment failed: ${error.message}`);

    // Provide more context for specific errors
    if (error.message.includes("insufficient funds")) {
      console.error("💡 Make sure your account has enough ETH for deployment and gas fees");
    } else if (error.message.includes("nonce")) {
      console.error("💡 Nonce issue - you might have pending transactions");
    }

    throw error;
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });