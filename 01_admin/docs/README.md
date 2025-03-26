# ABI to OpenAPI Converter Documentation

This documentation describes the ABI to OpenAPI Converter service, which transforms Ethereum smart contract ABIs into standardized OpenAPI specifications.

## Table of Contents

- [API Documentation](index.md) - Main API documentation
- [Usage Examples](examples.md) - Example requests and responses
- [Technical Details](technical.md) - Implementation details and architecture

## Quick Start

### Using the Web Interface

1. Visit the main page of the service
2. Paste your ABI JSON into the input field
3. Click "Convert" to generate the OpenAPI specification
4. Copy the result using the "Copy" button

### Using the REST API

```bash
curl -X POST http://your-service-url/generateSpec \
  -H "Content-Type: application/json" \
  -d @your-abi.json
```

Replace `your-abi.json` with the path to your ABI JSON file.

## Features

- **Automatic Type Conversion**: Solidity types are mapped to appropriate JSON Schema types
- **Method Mapping**: Smart contract functions are mapped to REST endpoints
- **Parameter Handling**: Function parameters are properly structured in the OpenAPI spec
- **Event Support**: Events from the ABI are included in the OpenAPI specification

## Service Architecture

```
Client Request → Express Server → ABI Parser → OpenAPI Generator → Response
```

## Use Cases

- Integrating smart contracts with traditional web services
- Building REST APIs around blockchain functionality
- Generating client SDKs for smart contract interaction
- Documentation generation for smart contract interfaces