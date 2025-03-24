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