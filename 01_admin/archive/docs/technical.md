# Technical Documentation

This document provides technical details on how the ABI to OpenAPI Converter works internally.

## Architecture Overview

The ABI to OpenAPI Converter follows a clean, modular architecture:

```
ABI JSON Input → Validation → Parsing → OpenAPI Generation → Output
```

## Core Modules

### ABI Parser (`abiParser.js`)

Responsible for parsing the raw ABI JSON into a structured format that can be used for OpenAPI generation.

Key functions:
- `parseAbi(abiJson)`: Main entry point that processes the ABI JSON
- `parseFunctionDefinition(functionItem)`: Extracts function details
- `parseEventDefinition(eventItem)`: Extracts event details
- `parseErrorDefinition(errorItem)`: Extracts error details
- `parseParameters(params)`: Processes input/output parameters
- `buildFunctionSignature(functionItem)`: Creates function signatures
- `determineHttpMethod(functionItem)`: Maps state mutability to HTTP methods

### API Generator (`apiGenerator.js`)

Transforms the parsed ABI into OpenAPI specification format.

Key functions:
- `generateOpenApiSpec(parsedAbi)`: Main function that creates the OpenAPI specification
- `createOperationObject(func)`: Creates an OpenAPI operation object
- `createInputSchema(func)`: Creates JSON schema for function inputs
- `createOutputSchema(func)`: Creates JSON schema for function outputs
- `createEventSchema(event)`: Creates JSON schema for events
- `createErrorSchema(error)`: Creates JSON schema for errors

### Validators (`validators.js`)

Validates the structure of the ABI JSON to ensure it can be processed correctly.

Key functions:
- `validateAbi(abiJson)`: Main validation function
- `validateFunctionItem(item, index, errors)`: Validates function entries
- `validateEventItem(item, index, errors)`: Validates event entries
- `validateInputs(params)`: Validates input parameter structures

### Utilities (`utils.js`)

Helper functions for type conversion and data manipulation.

Key functions:
- `convertSolidityTypeToJsonSchema(solidityType, components)`: Maps Solidity types to JSON Schema
- `createTupleSchema(components)`: Handles Solidity structs/tuples
- `processArrayRecursively(value, processFn)`: Processes nested array structures
- `formatNumberForJson(value)`: Properly formats numeric values for JSON

## Type Mapping Logic

Solidity types are mapped to JSON Schema types as follows:

- **Integers**: `uint8` to `uint256` and `int8` to `int256` are mapped to JavaScript's `integer` type, with large numbers converted to strings to avoid precision loss
- **Addresses**: `address` is mapped to `string` with an optional pattern for validation
- **Booleans**: `bool` is mapped directly to JSON Schema's `boolean`
- **Strings**: `string` is mapped directly to JSON Schema's `string`
- **Bytes**: `bytes` and `bytes1` to `bytes32` are mapped to `string` with a format hint
- **Arrays**: Array types like `uint256[]` or `address[]` are mapped to JSON Schema's `array` type with the appropriate item type
- **Tuples**: Represented as JSON Schema `object` types with properties corresponding to tuple elements

## HTTP Method Mapping

The converter determines the appropriate HTTP method based on the function's `stateMutability`:

- **GET**: Used for `view` and `pure` functions that don't modify state
- **POST**: Used for `nonpayable` and `payable` functions that can modify state

## OpenAPI Structure

The generated OpenAPI specification follows this structure:

```
{
  "openapi": "3.0.0",
  "info": { ... },
  "paths": {
    "/functionName": {
      "get" or "post": {
        "summary": "functionName(param1,param2,...)",
        "description": "...",
        "operationId": "...",
        "parameters" or "requestBody": { ... },
        "responses": { ... }
      }
    }
  },
  "components": {
    "schemas": { ... }
  }
}
```

## Error Handling

The converter implements robust error handling:

1. Validates input ABI JSON structure
2. Checks for required fields in functions, events, and errors
3. Validates parameter types against known Solidity types
4. Returns meaningful error messages for invalid inputs