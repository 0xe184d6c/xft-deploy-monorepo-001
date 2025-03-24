const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy DSToken
  const DSToken = await hre.ethers.getContractFactory("DSToken");
  const token = await DSToken.deploy();
  await token.deployed();
  console.log("DSToken deployed to:", token.address);

  // Example parameters for token initialization (would be used with a proxy)
  const tokenName = "Example Token";
  const tokenSymbol = "EXTKN";
  const tokenDecimals = 18;
  
  console.log("Deployment complete!");
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Token Decimals:", tokenDecimals);
  console.log("Implementation Address:", token.address);


  // Deploy other contracts similarly
  // Add deployment code for other contracts in your protocol
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });