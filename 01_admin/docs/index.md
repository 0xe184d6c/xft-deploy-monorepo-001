# ABI to OpenAPI Converter API

This document describes the REST API for converting Ethereum ABI JSON to OpenAPI specifications.

## Overview

The ABI to OpenAPI Converter provides a simple API to transform smart contract ABI definitions into standardized OpenAPI specifications, enabling easier integration with Web2 services.

## Base URL

```
http://your-service-url/
```

## Authentication

This API currently does not require authentication.

## Endpoints

### Generate OpenAPI Specification

Converts an Ethereum ABI JSON to an OpenAPI specification.

**URL**: `/generateSpec`

**Method**: `POST`

**Content-Type**: `application/json`

**Request Body**: The request body should contain the ABI JSON as a JSON array.

**Example Request**:

```bash
curl -X POST http://your-service-url/generateSpec \
  -H "Content-Type: application/json" \
  -d '[
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]'
```

**Success Response**:

- **Code**: 200 OK
- **Content-Type**: `application/json`
- **Body**: OpenAPI specification in JSON format

**Error Responses**:

- **Code**: 400 Bad Request
  - **Body**: `{ "error": "Invalid ABI JSON" }`
  - **Description**: The request body is not a valid ABI JSON.

- **Code**: 500 Internal Server Error
  - **Body**: `{ "error": "Server error" }`
  - **Description**: An error occurred during the conversion process.

## Type Mapping

The converter maps Solidity types to JSON Schema types as follows:

| Solidity Type | JSON Schema Type |
|---------------|------------------|
| uint, int     | integer or string (for large numbers) |
| address       | string |
| bool          | boolean |
| string        | string |
| bytes         | string |
| arrays        | array |
| tuples        | object |

## HTTP Method Mapping

Smart contract functions are mapped to HTTP methods based on their `stateMutability`:

| stateMutability | HTTP Method |
|-----------------|-------------|
| view, pure      | GET         |
| nonpayable, payable | POST    |

## Implementation Details

The service maintains a faithful representation of the original ABI structure, preserving function names, parameters, and types while converting them to a REST API format.