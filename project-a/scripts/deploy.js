const hre = require("hardhat");

async function main() {
  console.log("Deploying Storage1 contract...");

  // Get the contract factory
  const Storage1 = await hre.ethers.getContractFactory("Storage1");
  
  // Deploy the contract
  const storage1 = await Storage1.deploy();

  // Wait for deployment to finish
  await storage1.deployed();

  console.log(`Storage1 deployed to: ${storage1.address}`);
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });