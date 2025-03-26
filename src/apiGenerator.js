/**
 * API Generator module
 * Maps ABI functions to OpenAPI paths and components with enhanced schema generation
 * for complex/nested Solidity types and arrays.
 */

const { convertSolidityTypeToJsonSchema } = require('./utils');

/**
 * Generate OpenAPI specification from parsed ABI
 * @param {Object} parsedAbi - Parsed ABI from abiParser
 * @param {String} contractName - Name of the contract (default: SmartContract)
 * @returns {Object} OpenAPI specification
 */
function generateOpenApiSpec(parsedAbi, contractName = 'SmartContract') {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: `${contractName} API`,
      description: `API for interacting with the ${contractName} smart contract`,
      version: '1.0.0'
    },
    paths: {},
    components: {
      schemas: {}
    }
  };

  // Process functions to add paths and schemas
  parsedAbi.functions.forEach(func => {
    const pathKey = `/contract/${func.name}`;
    if (!openApiSpec.paths[pathKey]) {
      openApiSpec.paths[pathKey] = {};
    }
    const operation = createOperationObject(func);
    openApiSpec.paths[pathKey][func.httpMethod.toLowerCase()] = operation;

    if (func.inputs.length > 0) {
      const requestSchemaName = `${func.name}Request`;
      openApiSpec.components.schemas[requestSchemaName] = createInputSchema(func);
    }
    if (func.outputs.length > 0) {
      const responseSchemaName = `${func.name}Response`;
      openApiSpec.components.schemas[responseSchemaName] = createOutputSchema(func);
    }
  });

  // Process events to add schemas
  parsedAbi.events.forEach(event => {
    const schemaName = `${event.name}Event`;
    openApiSpec.components.schemas[schemaName] = createEventSchema(event);
  });

  // Process errors to add schemas
  parsedAbi.errors.forEach(error => {
    const schemaName = `${error.name}Error`;
    openApiSpec.components.schemas[schemaName] = createErrorSchema(error);
  });

  return openApiSpec;
}

/**
 * Create an OpenAPI operation object for a function
 * @param {Object} func - Parsed function from ABI
 * @returns {Object} OpenAPI operation object
 */
function createOperationObject(func) {
  const operation = {
    summary: `Call the ${func.name} function`,
    description: `Calls the '${func.name}' function on the smart contract${func.stateMutability ? ` (${func.stateMutability})` : ''}`,
    operationId: `call${capitalizeFirstLetter(func.name)}`,
    tags: ['Contract Functions'],
    responses: {
      '200': {
        description: 'Successful operation'
      },
      '400': {
        description: 'Invalid input'
      },
      '500': {
        description: 'Server error'
      }
    }
  };

  // For GET requests, map inputs to query parameters; for others, use request body.
  if (func.httpMethod === 'GET' && func.inputs.length > 0) {
    operation.parameters = func.inputs.map(input => ({
      name: input.name || `param${func.inputs.indexOf(input)}`,
      in: 'query',
      description: `Function parameter: ${input.type}`,
      required: true,
      schema: generateEnhancedJsonSchema(input.type, input.components)
    }));
  } else if (func.inputs.length > 0) {
    operation.requestBody = {
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${func.name}Request`
          }
        }
      },
      required: true
    };
  }

  if (func.outputs.length > 0) {
    operation.responses['200'].content = {
      'application/json': {
        schema: {
          $ref: `#/components/schemas/${func.name}Response`
        }
      }
    };
  }

  return operation;
}

/**
 * Create a JSON schema for function inputs.
 * @param {Object} func - Parsed function from ABI
 * @returns {Object} JSON schema for inputs
 */
function createInputSchema(func) {
  const properties = {};
  const required = [];

  func.inputs.forEach((input, index) => {
    const paramName = input.name || `param${index}`;
    properties[paramName] = generateEnhancedJsonSchema(input.type, input.components);
    required.push(paramName);
  });

  return {
    type: 'object',
    properties,
    required
  };
}

/**
 * Create a JSON schema for function outputs.
 * @param {Object} func - Parsed function from ABI
 * @returns {Object} JSON schema for outputs
 */
function createOutputSchema(func) {
  // If only one unnamed output, return its schema directly.
  if (func.outputs.length === 1 && !func.outputs[0].name) {
    return generateEnhancedJsonSchema(func.outputs[0].type, func.outputs[0].components);
  }

  const properties = {};
  func.outputs.forEach((output, index) => {
    const paramName = output.name || `return${index}`;
    properties[paramName] = generateEnhancedJsonSchema(output.type, output.components);
  });

  return {
    type: 'object',
    properties
  };
}

/**
 * Create a JSON schema for events.
 * @param {Object} event - Parsed event from ABI
 * @returns {Object} JSON schema for the event
 */
function createEventSchema(event) {
  const properties = {};
  event.inputs.forEach((input, index) => {
    const paramName = input.name || `param${index}`;
    properties[paramName] = {
      ...generateEnhancedJsonSchema(input.type, input.components),
      description: input.indexed ? 'Indexed parameter (used in event filters)' : 'Non-indexed parameter'
    };
  });
  return {
    type: 'object',
    properties,
    description: `Event: ${event.name}`
  };
}

/**
 * Create a JSON schema for errors.
 * @param {Object} error - Parsed error from ABI
 * @returns {Object} JSON schema for the error
 */
function createErrorSchema(error) {
  const properties = {};
  error.inputs.forEach((input, index) => {
    const paramName = input.name || `param${index}`;
    properties[paramName] = generateEnhancedJsonSchema(input.type, input.components);
  });
  return {
    type: 'object',
    properties,
    description: `Error: ${error.name}`
  };
}

/**
 * Generate an enhanced JSON schema for complex and nested Solidity types,
 * including arrays and tuple (struct) types.
 * @param {String} solType - Solidity type string
 * @param {Array} components - Components for tuple types
 * @returns {Object} JSON schema
 */
function generateEnhancedJsonSchema(solType, components) {
  // Handle tuple types (structs) with components
  if (solType === 'tuple') {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };
    if (components && Array.isArray(components)) {
      components.forEach((comp, index) => {
        const compName = comp.name || `field${index}`;
        schema.properties[compName] = generateEnhancedJsonSchema(comp.type, comp.components);
        schema.required.push(compName);
      });
    }
    return schema;
  }

  // Handle dynamic array types (e.g., uint256[], tuple[])
  const arrayMatch = solType.match(/(.*)\[\]$/);
  if (arrayMatch) {
    const baseType = arrayMatch[1];
    return {
      type: 'array',
      items: generateEnhancedJsonSchema(baseType, components)
    };
  }

  // Fallback: use the base conversion utility for simple types
  return convertSolidityTypeToJsonSchema(solType, components);
}

/**
 * Capitalize the first letter of a string.
 * @param {String} str - Input string
 * @returns {String} String with the first letter capitalized
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  generateOpenApiSpec
};
