/**
 * Utilities module
 * Helper functions for Solidity to JSON Schema conversion and recursive array handling
 */

/**
 * Convert a Solidity type to a JSON Schema type definition
 * @param {String} solidityType - Solidity type (e.g., 'uint256', 'address[]')
 * @param {Array} components - Components for tuple types
 * @returns {Object} JSON Schema type definition
 */
function convertSolidityTypeToJsonSchema(solidityType, components) {
  // Handle array types
  if (solidityType.endsWith('[]')) {
    const baseType = solidityType.slice(0, -2);
    return {
      type: 'array',
      items: convertSolidityTypeToJsonSchema(baseType, components)
    };
  }
  
  // Handle multi-dimensional arrays (like uint[][])
  if (solidityType.includes('[]')) {
    const lastBracketPos = solidityType.lastIndexOf('[]');
    const baseType = solidityType.slice(0, lastBracketPos);
    return {
      type: 'array',
      items: convertSolidityTypeToJsonSchema(baseType, components)
    };
  }
  
  // Handle tuple types
  if (solidityType === 'tuple' && components) {
    return createTupleSchema(components);
  }
  
  // Handle specific Solidity types
  if (solidityType.startsWith('uint') || solidityType.startsWith('int')) {
    return {
      type: 'string',
      description: `${solidityType} (as string due to potential large values)`,
      pattern: '^[0-9]+$' // Ensure it contains only digits
    };
  }
  
  if (solidityType === 'bool') {
    return { type: 'boolean' };
  }
  
  if (solidityType === 'address') {
    return {
      type: 'string',
      description: 'Ethereum address (40 hex characters prefixed with 0x)',
      pattern: '^0x[a-fA-F0-9]{40}$'
    };
  }
  
  if (solidityType === 'string') {
    return { type: 'string' };
  }
  
  if (solidityType.startsWith('bytes')) {
    return {
      type: 'string',
      description: `${solidityType} (hex string prefixed with 0x)`,
      pattern: '^0x[a-fA-F0-9]*$'
    };
  }
  
  // Default for unknown types
  return {
    type: 'string',
    description: `Solidity type: ${solidityType}`
  };
}

/**
 * Create a JSON Schema for a Solidity tuple
 * @param {Array} components - Components of the tuple
 * @returns {Object} JSON Schema for the tuple
 */
function createTupleSchema(components) {
  const properties = {};
  const required = [];
  
  components.forEach((component, index) => {
    const name = component.name || `item${index}`;
    properties[name] = convertSolidityTypeToJsonSchema(component.type, component.components);
    required.push(name);
  });
  
  return {
    type: 'object',
    properties,
    required
  };
}

/**
 * Process a complex array structure recursively
 * (e.g., mapping array of arrays of structs)
 * @param {*} value - Value to process
 * @param {Function} processFn - Processing function
 * @returns {*} Processed value
 */
function processArrayRecursively(value, processFn) {
  if (Array.isArray(value)) {
    return value.map(item => processArrayRecursively(item, processFn));
  } else if (value && typeof value === 'object') {
    const result = {};
    for (const key in value) {
      result[key] = processArrayRecursively(value[key], processFn);
    }
    return result;
  } else {
    return processFn(value);
  }
}

/**
 * Format a number for JSON output
 * Handles large integers by converting them to strings
 * @param {Number|String|BigInt} value - Numeric value
 * @returns {Number|String} Formatted value for JSON
 */
function formatNumberForJson(value) {
  // If it's already a string, return it
  if (typeof value === 'string') {
    return value;
  }
  
  // For BigInt, convert to string
  if (typeof value === 'bigint') {
    return value.toString();
  }
  
  // For regular numbers, check if they're integers that are too large
  if (typeof value === 'number') {
    // Check if it's an integer that might be too large for precise representation
    if (Number.isInteger(value) && Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      return value.toString();
    }
    return value;
  }
  
  return value;
}

module.exports = {
  convertSolidityTypeToJsonSchema,
  processArrayRecursively,
  formatNumberForJson
};
