import { ethers, upgrades, run, network } from "hardhat";

async function main() {
  // Hardcoded values
  const tokenName = "XFT Digital Dollar";
  const tokenSymbol = "USDX";
  const ownerAddress = "0x2f572059DbC598C8acfeA4AF06FE4f7669D1b3b1"; // Replace with your address

  console.log("==========================================");
  console.log(`Deploying USDX to ${network.name}...`);
  console.log(`Token Name: ${tokenName}`);
  console.log(`Token Symbol: ${tokenSymbol}`);
  console.log(`Owner Address: ${ownerAddress}`);
  console.log("==========================================");

  // Get the contract factory
  const USDX = await ethers.getContractFactory("USDX");

  // Deploy the contract using the UUPS proxy pattern
  console.log("Deploying proxy...");
  const usdxProxy = await upgrades.deployProxy(
    USDX, 
    [tokenName, tokenSymbol, ownerAddress], 
    { 
      kind: "uups",
      initializer: "initialize"
    }
  );

  // Wait for deployment to finish
  await usdxProxy.deployed();

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(usdxProxy.address);

  console.log(`USDX proxy deployed to: ${usdxProxy.address}`);
  console.log(`USDX implementation deployed to: ${implementationAddress}`);

  // Verify the implementation contract on Etherscan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");

    // Wait for 6 block confirmations for better Etherscan verification chances
    await usdxProxy.deployTransaction.wait(6);

    console.log(`Verifying implementation contract on ${network.name}...`);

    try {
      // Verify the implementation contract
      await run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
      });
      console.log("Implementation contract verified successfully");

      // Log deployment summary
      console.log("\n==========================================");
      console.log("DEPLOYMENT SUMMARY");
      console.log("==========================================");
      console.log(`USDX Proxy Address: ${usdxProxy.address}`);
      console.log(`Implementation Address: ${implementationAddress}`);
      console.log(`Owner (Admin): ${ownerAddress}`);
      console.log("\nNext steps:");
      console.log("1. Grant roles to appropriate addresses:");
      console.log(`   - MINTER_ROLE to allow minting tokens`);
      console.log(`   - BURNER_ROLE to allow burning tokens`);
      console.log("2. Mint initial tokens to desired recipients");
      console.log("==========================================");

    } catch (error: any) {
      console.log("Error verifying contract: ", error.message);
    }
  }

  return { proxyAddress: usdxProxy.address, implementationAddress };
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
  });