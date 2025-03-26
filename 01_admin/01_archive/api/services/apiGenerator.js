/**
 * API Generator module
 * Maps ABI functions to OpenAPI paths and components
 */

const { convertSolidityTypeToJsonSchema } = require('../../utils/utils');

/**
 * Generate OpenAPI specification from parsed ABI
 * @param {Object} parsedAbi - Parsed ABI from abiParser
 * @returns {Object} OpenAPI specification
 */
function generateOpenApiSpec(parsedAbi) {
  // Create base OpenAPI structure
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: `${parsedAbi.contractName} API`,
      description: `API for interacting with the ${parsedAbi.contractName} smart contract`,
      version: '1.0.0'
    },
    paths: {},
    components: {
      schemas: {}
    }
  };

  // Add function paths
  parsedAbi.functions.forEach(func => {
    const pathKey = `/contract/${func.name}`;
    
    // Create path object if it doesn't exist
    if (!openApiSpec.paths[pathKey]) {
      openApiSpec.paths[pathKey] = {};
    }
    
    // Add operation (GET or POST)
    const operation = createOperationObject(func);
    openApiSpec.paths[pathKey][func.httpMethod.toLowerCase()] = operation;
    
    // Add function input and output schemas to components
    if (func.inputs.length > 0) {
      const requestSchemaName = `${func.name}Request`;
      openApiSpec.components.schemas[requestSchemaName] = createInputSchema(func);
    }
    
    if (func.outputs.length > 0) {
      const responseSchemaName = `${func.name}Response`;
      openApiSpec.components.schemas[responseSchemaName] = createOutputSchema(func);
    }
  });

  // Add event schemas
  parsedAbi.events.forEach(event => {
    const schemaName = `${event.name}Event`;
    openApiSpec.components.schemas[schemaName] = createEventSchema(event);
  });

  // Add error schemas
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

  // Add parameters/request body based on HTTP method
  if (func.httpMethod === 'GET' && func.inputs.length > 0) {
    // For GET requests, inputs become query parameters
    operation.parameters = func.inputs.map(input => ({
      name: input.name || `param${func.inputs.indexOf(input)}`,
      in: 'query',
      description: `Function parameter: ${input.type}`,
      required: true,
      schema: convertSolidityTypeToJsonSchema(input.type, input.components)
    }));
  } else if (func.inputs.length > 0) {
    // For POST requests, inputs become request body
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

  // Add response schema if function has outputs
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
 * Create a JSON schema for function inputs
 * @param {Object} func - Parsed function from ABI
 * @returns {Object} JSON schema for inputs
 */
function createInputSchema(func) {
  const properties = {};
  const required = [];

  func.inputs.forEach(input => {
    const paramName = input.name || `param${func.inputs.indexOf(input)}`;
    properties[paramName] = convertSolidityTypeToJsonSchema(input.type, input.components);
    required.push(paramName);
  });

  return {
    type: 'object',
    properties,
    required
  };
}

/**
 * Create a JSON schema for function outputs
 * @param {Object} func - Parsed function from ABI
 * @returns {Object} JSON schema for outputs
 */
function createOutputSchema(func) {
  // If there's only one output and it doesn't have a name, we return it directly
  if (func.outputs.length === 1 && !func.outputs[0].name) {
    return convertSolidityTypeToJsonSchema(func.outputs[0].type, func.outputs[0].components);
  }

  // Otherwise, create an object with named outputs
  const properties = {};
  
  func.outputs.forEach(output => {
    const paramName = output.name || `return${func.outputs.indexOf(output)}`;
    properties[paramName] = convertSolidityTypeToJsonSchema(output.type, output.components);
  });

  return {
    type: 'object',
    properties
  };
}

/**
 * Create a JSON schema for events
 * @param {Object} event - Parsed event from ABI
 * @returns {Object} JSON schema for the event
 */
function createEventSchema(event) {
  const properties = {};
  
  event.inputs.forEach(input => {
    const paramName = input.name || `param${event.inputs.indexOf(input)}`;
    properties[paramName] = {
      ...convertSolidityTypeToJsonSchema(input.type, input.components),
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
 * Create a JSON schema for errors
 * @param {Object} error - Parsed error from ABI
 * @returns {Object} JSON schema for the error
 */
function createErrorSchema(error) {
  const properties = {};
  
  error.inputs.forEach(input => {
    const paramName = input.name || `param${error.inputs.indexOf(input)}`;
    properties[paramName] = convertSolidityTypeToJsonSchema(input.type, input.components);
  });

  return {
    type: 'object',
    properties,
    description: `Error: ${error.name}`
  };
}

/**
 * Capitalize the first letter of a string
 * @param {String} str - Input string
 * @returns {String} String with first letter capitalized
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  generateOpenApiSpec
};