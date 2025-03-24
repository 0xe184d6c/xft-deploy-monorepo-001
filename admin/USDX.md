
hardhat.config.ts
package.json
contracts/USDX.sol
scripts/deploy.ts
scripts/upgrade.ts
















USDX Project Setup
Create directory structure:

/usdx
├── contracts/
│   └── USDX.sol         (Upgradeable ERC20 contract)
├── scripts/
│   ├── deploy.ts        (For proxy deployment)
│   └── upgrade.ts       (For upgrades)
├── hardhat.config.ts
├── package.json
└── tsconfig.json
Install dependencies:

npm install --save-dev @nomicfoundation/hardhat-toolbox @openzeppelin/contracts-upgradeable @openzeppelin/hardhat-upgrades dotenv hardhat typescript ts-node
Configure hardhat.config.ts:

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    }
  }
};
export default config;
Setup deploy.ts script:

import { ethers, upgrades } from "hardhat";
async function main() {
  const USDX = await ethers.getContractFactory("USDX");
  const proxy = await upgrades.deployProxy(USDX, 
    ["USD Stablecoin", "USDX", "0xYourOwnerAddress"], 
    { kind: "uups" }
  );
  await proxy.deployed();
  console.log("USDX deployed to:", proxy.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
Create upgrade.ts script:

import { ethers, upgrades } from "hardhat";
async function main() {
  const proxyAddress = "YOUR_PROXY_ADDRESS";
  const USDXv2 = await ethers.getContractFactory("USDX");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, USDXv2);
  console.log("USDX upgraded at:", upgraded.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
The USDX contract uses OpenZeppelin's Upgradeable contracts with UUPS proxy pattern, roles-based access control, and ERC20 with permit functionality. It includes custom features like blocklisting and reward multipliers.


# Create project directory structure
mkdir -p usdx/contracts usdx/scripts usdx/test

# Move to project directory
cd usdx

# Create package.json
npm init -y

# Install dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox @openzeppelin/contracts-upgradeable @openzeppelin/hardhat-upgrades @nomicfoundation/hardhat-chai-matchers hardhat typescript ts-node dotenv ethers@^5.7.2

# Create .env file for API keys
touch .env

# Create basic config files
touch hardhat.config.ts tsconfig.json

# Create USDX contract
touch contracts/USDX.sol

# Create deployment scripts
touch scripts/deploy.ts scripts/upgrade.ts

# Create test file
touch test/USDX.test.ts

# Compile the contracts
npx hardhat compile

Here's a script that extracts the ABI from your compiled USDX contract and creates a construct.json file with the initialization parameters. Save this as scripts/info.ts:

import fs from 'fs';
import path from 'path';
async function main() {
  try {
    // Define paths
    const artifactPath = path.join(__dirname, '../artifacts/contracts/USDX.sol/USDX.json');
    const abiOutputPath = path.join(__dirname, '../abi.json');
    const constructOutputPath = path.join(__dirname, '../construct.json');

    // Read artifact file
    console.log('Reading contract artifact...');
    const artifactRaw = fs.readFileSync(artifactPath, 'utf8');
    const artifact = JSON.parse(artifactRaw);

    // Extract ABI
    const abi = artifact.abi;
    console.log('ABI extracted successfully');

    // Write ABI to file
    fs.writeFileSync(abiOutputPath, JSON.stringify(abi, null, 2));
    console.log(`ABI written to ${abiOutputPath}`);

    // Extract initialization parameters from the initialize function
    const initializeFunc = abi.find((item: any) => 
      item.type === 'function' && 
      item.name === 'initialize'
    );

    if (!initializeFunc) {
      throw new Error('Initialize function not found in ABI');
    }

    // Create construct.json with initialization parameters and types
    const constructParams = {
      functionName: 'initialize',
      parameters: initializeFunc.inputs.map((input: any) => ({
        name: input.name,
        type: input.type,
        description: `Required parameter: ${input.name} (${input.type})`,
        example: getExampleValue(input.type, input.name)
      }))
    };

    // Write construct info to file
    fs.writeFileSync(constructOutputPath, JSON.stringify(constructParams, null, 2));
    console.log(`Construct parameters written to ${constructOutputPath}`);

  } catch (error) {
    console.error('Error extracting contract information:', error);
    process.exitCode = 1;
  }
}
// Helper function to provide example values based on parameter types
function getExampleValue(type: string, name: string): any {
  if (type === 'string') {
    if (name.includes('name')) return 'USD Stablecoin';
    if (name.includes('symbol')) return 'USDX';
    return '';
  }
  if (type === 'address') return '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Example address
  if (type.includes('uint')) return '1000000000000000000'; // 1 ETH in wei
  if (type === 'bool') return true;
  if (type.includes('[]')) return [];
  return null;
}
// Run the script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
To run this script:

npx ts-node scripts/info.ts
This script will:

Read the compiled contract artifact after you've run npx hardhat compile
Extract the ABI and save it to abi.json in your project root
Find the initialize function in the ABI
Create a construct.json file with:
The function name to call (initialize)
All parameters needed for initialization
Their types and example values
The construct.json will help you understand what parameters are needed to deploy the contract properly.

If you need to execute this script without TypeScript (using plain JavaScript), let me know and I can provide that version too.