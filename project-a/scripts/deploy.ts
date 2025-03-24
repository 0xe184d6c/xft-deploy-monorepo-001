import { ethers, network, run } from "hardhat";

async function main() {
  // Get network information
  const networkName = network.name;
  console.log(`Deploying Storage1 contract to ${networkName}...`);

  // Get the contract factory
  const Storage1 = await ethers.getContractFactory("Storage1");
  
  // Deploy the contract
  console.log("Deploying...");
  const storage1 = await Storage1.deploy();

  // Wait for deployment to finish
  await storage1.deployed();

  console.log(`Storage1 deployed to: ${storage1.address} on ${networkName}`);
  
  // Verify the contract on Etherscan if not on a local network
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("Waiting for block confirmations...");
    
    // Wait for 6 block confirmations for better Etherscan verification chances
    await storage1.deployTransaction.wait(6);
    
    console.log(`Verifying contract on ${networkName}...`);
    
    try {
      await run("verify:verify", {
        address: storage1.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract: ", error);
    }
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });