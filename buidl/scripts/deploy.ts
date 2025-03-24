
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

async function main() {
  const [deployer]: Signer[] = await ethers.getSigners();
  const ADMIN_ADDRESS = process.env.ADDRESS || "0x2f572059DbC598C8acfeA4AF06FE4f7669D1b3b1";
  console.log("Deploying contracts with:", await deployer.getAddress());
  console.log("Setting admin roles to:", ADMIN_ADDRESS);

  // Deploy Implementation
  const DSToken = await ethers.getContractFactory("DSToken");
  const implementation = await DSToken.deploy();
  const implTx = await implementation.deployTransaction.wait();
  console.log("Implementation deployed to:", implementation.address);
  console.log("Implementation TX Hash:", implTx.transactionHash);

  // Deploy Proxy
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const initData = DSToken.interface.encodeFunctionData("initialize", [
    "Example Token",
    "EXTKN",
    18
  ]);

  const proxy = await ERC1967Proxy.deploy(
    implementation.address,
    initData
  );
  const proxyTx = await proxy.deployTransaction.wait();
  
  // Get token instance through proxy
  const token = DSToken.attach(proxy.address);

  // Set all required services
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

  // Set all required roles 
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
    implementation: {
      address: implementation.address,
      txHash: implTx.transactionHash
    },
    proxy: {
      address: proxy.address, 
      txHash: proxyTx.transactionHash
    },
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
