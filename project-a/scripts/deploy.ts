import { ethers, run } from "hardhat";

async function main() {
  console.log("Deploying Storage1 contract to Sepolia...");

  // Get the contract factory
  const Storage1 = await ethers.getContractFactory("Storage1");
  
  // Deploy the contract
  console.log("Deploying...");
  const storage1 = await Storage1.deploy();

  // Wait for deployment to finish
  await storage1.deployed();

  console.log(`Storage1 deployed to: ${storage1.address} on Sepolia`);
  
  // Verify the contract on Etherscan
  console.log("Waiting for block confirmations...");
  
  // Wait for 6 block confirmations for better Etherscan verification chances
  await storage1.deployTransaction.wait(6);
  
  console.log("Verifying contract on Sepolia...");
  
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

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });