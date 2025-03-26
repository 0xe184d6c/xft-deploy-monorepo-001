# API Usage Examples

This document provides examples of using the ABI to OpenAPI Converter API.

## Basic Example

### Input: Simple ERC20 Function

```json
[
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
]
```

### Output: OpenAPI Specification

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Smart Contract API",
    "description": "API for interacting with a smart contract",
    "version": "1.0.0"
  },
  "paths": {
    "/totalSupply": {
      "get": {
        "summary": "totalSupply()",
        "description": "A view function that returns the total supply",
        "operationId": "totalSupply",
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "0": {
                      "type": "integer",
                      "description": "uint256"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Complex Example

### Input: Transfer Function with Parameters

```json
[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

### Output: OpenAPI Specification

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Smart Contract API",
    "description": "API for interacting with a smart contract",
    "version": "1.0.0"
  },
  "paths": {
    "/transfer": {
      "post": {
        "summary": "transfer(address,uint256)",
        "description": "A nonpayable function that transfers tokens",
        "operationId": "transfer",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["recipient", "amount"],
                "properties": {
                  "recipient": {
                    "type": "string",
                    "description": "address"
                  },
                  "amount": {
                    "type": "integer",
                    "description": "uint256"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "0": {
                      "type": "boolean",
                      "description": "bool"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Using the API with cURL

### Basic GET Request (after conversion)

```bash
curl -X GET "http://your-service-url/totalSupply"
```

### POST Request with Parameters (after conversion)

```bash
curl -X POST "http://your-service-url/transfer" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "amount": 1000000000000000000
  }'
```

### Converting ABI to OpenAPI

```bash
curl -X POST "http://your-service-url/generateSpec" \
  -H "Content-Type: application/json" \
  -d @contract-abi.json
```

Where `contract-abi.json` is a file containing your contract's ABI.