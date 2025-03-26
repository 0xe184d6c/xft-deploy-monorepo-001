/**
 * ABI Parser module
 * Extracts function definitions, parameters, and types from Ethereum ABI JSON
 */

/**
 * Parse an Ethereum ABI JSON into a structured format for OpenAPI generation
 * @param {Array} abiJson - The Ethereum ABI as a JSON array
 * @returns {Object} Parsed ABI with function definitions and parameters
 */
function parseAbi(abiJson) {
  try {
    // Object to store parsed ABI data
    const parsedAbi = {
      contractName: 'SmartContract', // Default name if not provided
      functions: [],
      events: [],
      errors: []
    };

    if (!abiJson) {
      throw new Error('ABI input is null or undefined');
    }

    // Extract contract name if available (some ABIs include this)
  if (abiJson.contractName) {
    parsedAbi.contractName = abiJson.contractName;
    // If contractName exists at the top level, the functions might be in the abi property
    if (Array.isArray(abiJson.abi)) {
      abiJson = abiJson.abi;
    }
  }

  // Handle the case when the provided input is not an array but has an abi field
  if (!Array.isArray(abiJson) && Array.isArray(abiJson.abi)) {
    if (abiJson.contractName) {
      parsedAbi.contractName = abiJson.contractName;
    }
    abiJson = abiJson.abi;
  }

  // Ensure we have an array to work with
  if (!Array.isArray(abiJson)) {
    throw new Error('ABI must be an array or an object with an abi array property');
  }

  // Iterate through the ABI items and categorize them
  abiJson.forEach(item => {
    switch (item.type) {
      case 'function':
        parsedAbi.functions.push(parseFunctionDefinition(item));
        break;
      case 'event':
        parsedAbi.events.push(parseEventDefinition(item));
        break;
      case 'error':
        parsedAbi.errors.push(parseErrorDefinition(item));
        break;
      // fallthrough for constructor, fallback, receive
      default:
        // Currently, we're only focusing on functions, events, and errors
        break;
    }
  });

  return parsedAbi;
  } catch (error) {
    throw new Error(`Failed to parse ABI: ${error.message}`);
  }
}

/**
 * Parse a function definition from the ABI
 * @param {Object} functionItem - Function item from the ABI
 * @returns {Object} Parsed function definition
 */
function parseFunctionDefinition(functionItem) {
  return {
    name: functionItem.name,
    stateMutability: functionItem.stateMutability || 'nonpayable',
    constant: functionItem.constant || false,
    payable: functionItem.payable || false,
    inputs: parseParameters(functionItem.inputs || []),
    outputs: parseParameters(functionItem.outputs || []),
    signature: buildFunctionSignature(functionItem),
    httpMethod: determineHttpMethod(functionItem)
  };
}

/**
 * Parse an event definition from the ABI
 * @param {Object} eventItem - Event item from the ABI
 * @returns {Object} Parsed event definition
 */
function parseEventDefinition(eventItem) {
  return {
    name: eventItem.name,
    inputs: parseParameters(eventItem.inputs || []),
    anonymous: eventItem.anonymous || false,
    signature: buildEventSignature(eventItem)
  };
}

/**
 * Parse an error definition from the ABI
 * @param {Object} errorItem - Error item from the ABI
 * @returns {Object} Parsed error definition
 */
function parseErrorDefinition(errorItem) {
  return {
    name: errorItem.name,
    inputs: parseParameters(errorItem.inputs || []),
    signature: buildErrorSignature(errorItem)
  };
}

/**
 * Parse parameters (inputs or outputs) from a function, event, or error
 * @param {Array} params - Array of parameter objects
 * @returns {Array} Parsed parameters with detailed type information
 */
function parseParameters(params) {
  return params.map(param => ({
    name: param.name || '',
    type: param.type,
    components: param.components ? parseParameters(param.components) : undefined,
    indexed: param.indexed || false,
    internalType: param.internalType || param.type
  }));
}

/**
 * Build a function signature string (e.g., "transfer(address,uint256)")
 * @param {Object} functionItem - Function item from the ABI
 * @returns {String} Function signature
 */
function buildFunctionSignature(functionItem) {
  const paramTypes = (functionItem.inputs || [])
    .map(input => input.type)
    .join(',');
  
  return `${functionItem.name}(${paramTypes})`;
}

/**
 * Build an event signature string
 * @param {Object} eventItem - Event item from the ABI
 * @returns {String} Event signature
 */
function buildEventSignature(eventItem) {
  const paramTypes = (eventItem.inputs || [])
    .map(input => input.type)
    .join(',');
  
  return `${eventItem.name}(${paramTypes})`;
}

/**
 * Build an error signature string
 * @param {Object} errorItem - Error item from the ABI
 * @returns {String} Error signature
 */
function buildErrorSignature(errorItem) {
  const paramTypes = (errorItem.inputs || [])
    .map(input => input.type)
    .join(',');
  
  return `${errorItem.name}(${paramTypes})`;
}

/**
 * Determine the appropriate HTTP method based on function state mutability
 * @param {Object} functionItem - Function item from the ABI
 * @returns {String} HTTP method (GET or POST)
 */
function determineHttpMethod(functionItem) {
  // view and pure functions don't modify state, so they can be GET requests
  if (
    functionItem.stateMutability === 'view' || 
    functionItem.stateMutability === 'pure' ||
    functionItem.constant === true
  ) {
    return 'GET';
  }
  
  // All other functions potentially modify state and should be POST
  return 'POST';
}

module.exports = {
  parseAbi
};
