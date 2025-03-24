
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const ADMIN_ADDRESS = process.env.ADDRESS || deployer.address;
  console.log("Deploying contracts with:", deployer.address);
  console.log("Setting admin roles to:", ADMIN_ADDRESS);

  // First deploy TokenLibrary
  console.log("\nDeploying TokenLibrary...");
  const TokenLibrary = await hre.ethers.getContractFactory("TokenLibrary");
  const tokenLibrary = await TokenLibrary.deploy();
  await tokenLibrary.deployed();
  console.log("TokenLibrary deployed to:", tokenLibrary.address);

  // Deploy TokenPartitionsLibrary if needed
  console.log("\nDeploying TokenPartitionsLibrary...");
  const TokenPartitionsLibrary = await hre.ethers.getContractFactory("TokenPartitionsLibrary");
  const tokenPartitionsLibrary = await TokenPartitionsLibrary.deploy();
  await tokenPartitionsLibrary.deployed();
  console.log("TokenPartitionsLibrary deployed to:", tokenPartitionsLibrary.address);

  // Deploy DSToken with libraries linked
  console.log("\nDeploying DSToken implementation...");
  const DSToken = await hre.ethers.getContractFactory("DSToken", {
    libraries: {
      TokenLibrary: tokenLibrary.address,
      TokenPartitionsLibrary: tokenPartitionsLibrary.address
    }
  });
  const implementation = await DSToken.deploy();
  await implementation.deployed();
  console.log("Implementation deployed to:", implementation.address);

  // Deploy Proxy
  console.log("\nDeploying ERC1967Proxy...");
  const ERC1967Proxy = await hre.ethers.getContractFactory("ERC1967Proxy");
  const initData = DSToken.interface.encodeFunctionData("initialize", [
    "Example Token",
    "EXTKN",
    18
  ]);

  const proxy = await ERC1967Proxy.deploy(
    implementation.address,
    initData
  );
  await proxy.deployed();
  console.log("Proxy deployed to:", proxy.address);

  // Get token instance through proxy
  const token = DSToken.attach(proxy.address);

  // Set required services
  console.log("\nSetting up services...");
  const services = [
    await token.REGISTRY_SERVICE(),
    await token.COMPLIANCE_SERVICE(),
    await token.COMPLIANCE_CONFIGURATION_SERVICE(),
    await token.TRUST_SERVICE(),
    await token.OMNIBUS_TBE_CONTROLLER(),
    await token.WALLET_MANAGER(),
    await token.WALLET_REGISTRAR(),
    await token.LOCK_MANAGER(),
    await token.PARTITIONS_MANAGER()
  ];

  for (const serviceId of services) {
    await token.setDSService(serviceId, ADMIN_ADDRESS);
    console.log(`Set service ${serviceId} to ${ADMIN_ADDRESS}`);
  }

  // Set required roles
  console.log("\nSetting up roles...");
  const trustService = await ethers.getContractAt("IDSTrustService", ADMIN_ADDRESS);
  const roles = [
    await token.ROLE_MASTER(),
    await token.ROLE_ISSUER(),
    await token.ROLE_TRANSFER_AGENT(),
    await token.ROLE_EXCHANGE()
  ];

  for (const role of roles) {
    await trustService.setRole(ADMIN_ADDRESS, role);
    console.log(`Set role ${role} to ${ADMIN_ADDRESS}`);
  }

  return {
    libraries: {
      tokenLibrary: tokenLibrary.address,
      tokenPartitionsLibrary: tokenPartitionsLibrary.address
    },
    implementation: implementation.address,
    proxy: proxy.address,
    admin: ADMIN_ADDRESS
  };
}

main()
  .then((deployed) => {
    console.log("\nDeployment Summary:");
    console.log(JSON.stringify(deployed, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
