import hre from "hardhat";

async function main() {
  console.log("Deploying Storage2 contract...");

  // Get the contract factory
  const Storage2 = await hre.ethers.getContractFactory("Storage2");
  
  // Deploy the contract
  const storage2 = await Storage2.deploy();

  // Wait for deployment to finish
  await storage2.deployed();

  console.log(`Storage2 deployed to: ${storage2.address}`);
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });