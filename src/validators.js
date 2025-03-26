/**
 * Validator module
 * Validates ABI JSON structure before processing
 */

/**
 * Validate the structure of an Ethereum ABI JSON
 * @param {Array|Object} abiJson - The Ethereum ABI as a JSON array or object with abi property
 * @returns {Object} Validation result {valid: boolean, errors: Array}
 */
function validateAbi(abiJson) {
  const errors = [];
  
  // If abiJson is an object with an abi property, use that
  if (!Array.isArray(abiJson) && abiJson.abi && Array.isArray(abiJson.abi)) {
    abiJson = abiJson.abi;
  }
  
  // Check if ABI is an array
  if (!Array.isArray(abiJson)) {
    return {
      valid: false,
      errors: ['ABI must be an array or an object with an abi array property']
    };
  }
  
  // Check if ABI array is empty
  if (abiJson.length === 0) {
    return {
      valid: false,
      errors: ['ABI array is empty']
    };
  }
  
  // Validate each item in the ABI
  abiJson.forEach((item, index) => {
    // Check if the item is an object
    if (typeof item !== 'object' || item === null) {
      errors.push(`ABI item at index ${index} must be an object`);
      return;
    }
    
    // Check if the item has a type property
    if (!item.type) {
      errors.push(`ABI item at index ${index} is missing 'type' property`);
      return;
    }
    
    // Validate specific item types
    switch (item.type) {
      case 'function':
        validateFunctionItem(item, index, errors);
        break;
      case 'event':
        validateEventItem(item, index, errors);
        break;
      case 'constructor':
      case 'fallback':
      case 'receive':
      case 'error':
        // Basic validation for these types
        if (item.type !== 'fallback' && item.type !== 'receive' && !validateInputs(item.inputs)) {
          errors.push(`ABI ${item.type} at index ${index} has invalid 'inputs' property`);
        }
        break;
      default:
        errors.push(`ABI item at index ${index} has unknown type: ${item.type}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a function item in the ABI
 * @param {Object} item - Function item from the ABI
 * @param {Number} index - Index in the ABI array
 * @param {Array} errors - Array to collect validation errors
 */
function validateFunctionItem(item, index, errors) {
  // Check if function has a name
  if (!item.name) {
    errors.push(`Function at index ${index} is missing 'name' property`);
  }
  
  // Check inputs and outputs
  if (!validateInputs(item.inputs)) {
    errors.push(`Function '${item.name || index}' has invalid 'inputs' property`);
  }
  
  if (!validateInputs(item.outputs)) {
    errors.push(`Function '${item.name || index}' has invalid 'outputs' property`);
  }
  
  // Check stateMutability (optional in some older ABIs)
  const validStateMutabilities = ['pure', 'view', 'nonpayable', 'payable'];
  if (item.stateMutability && !validStateMutabilities.includes(item.stateMutability)) {
    errors.push(`Function '${item.name || index}' has invalid 'stateMutability': ${item.stateMutability}`);
  }
}

/**
 * Validate an event item in the ABI
 * @param {Object} item - Event item from the ABI
 * @param {Number} index - Index in the ABI array
 * @param {Array} errors - Array to collect validation errors
 */
function validateEventItem(item, index, errors) {
  // Check if event has a name
  if (!item.name) {
    errors.push(`Event at index ${index} is missing 'name' property`);
  }
  
  // Check inputs
  if (!validateInputs(item.inputs)) {
    errors.push(`Event '${item.name || index}' has invalid 'inputs' property`);
  }
  
  // Check that anonymous is a boolean if present
  if (item.anonymous !== undefined && typeof item.anonymous !== 'boolean') {
    errors.push(`Event '${item.name || index}' has invalid 'anonymous' property: should be a boolean`);
  }
}

/**
 * Validate inputs/outputs array
 * @param {Array} params - Inputs or outputs array
 * @returns {Boolean} True if valid, false otherwise
 */
function validateInputs(params) {
  // If undefined, consider it valid (empty array)
  if (params === undefined) {
    return true;
  }
  
  // Must be an array
  if (!Array.isArray(params)) {
    return false;
  }
  
  // Each item must have a type
  for (const param of params) {
    if (typeof param !== 'object' || param === null || !param.type) {
      return false;
    }
    
    // If components exist (for tuples), they must be valid
    if (param.type === 'tuple' || param.type.endsWith('[]')) {
      if (param.components && !validateInputs(param.components)) {
        return false;
      }
    }
  }
  
  return true;
}

module.exports = {
  validateAbi
};
