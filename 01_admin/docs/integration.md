# Integration Guide

This guide explains how to integrate the ABI to OpenAPI Converter into your workflow.

## Programmatic Integration

### Node.js

```javascript
const axios = require('axios');
const fs = require('fs');

// Read ABI from file
const abi = JSON.parse(fs.readFileSync('contract-abi.json', 'utf8'));

// Convert ABI to OpenAPI
async function convertAbiToOpenApi() {
  try {
    const response = await axios.post('http://your-service-url/generateSpec', abi);
    const openApiSpec = response.data;
    
    // Save OpenAPI spec to file
    fs.writeFileSync('openapi-spec.json', JSON.stringify(openApiSpec, null, 2));
    console.log('OpenAPI specification generated successfully');
  } catch (error) {
    console.error('Error converting ABI to OpenAPI:', error.message);
  }
}

convertAbiToOpenApi();
```

### Python

```python
import json
import requests

# Read ABI from file
with open('contract-abi.json', 'r') as file:
    abi = json.load(file)

# Convert ABI to OpenAPI
try:
    response = requests.post('http://your-service-url/generateSpec', json=abi)
    response.raise_for_status()
    openapi_spec = response.json()
    
    # Save OpenAPI spec to file
    with open('openapi-spec.json', 'w') as file:
        json.dump(openapi_spec, file, indent=2)
    print('OpenAPI specification generated successfully')
except requests.exceptions.RequestException as error:
    print(f'Error converting ABI to OpenAPI: {error}')
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Generate OpenAPI Spec

on:
  push:
    paths:
      - 'contract-abi.json'

jobs:
  generate-openapi:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Convert ABI to OpenAPI
        run: |
          curl -X POST http://your-service-url/generateSpec \
            -H "Content-Type: application/json" \
            -d @contract-abi.json > openapi-spec.json
      
      - name: Commit OpenAPI spec
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add openapi-spec.json
          git commit -m "Update OpenAPI specification" || echo "No changes to commit"
          git push
```

## Using Generated OpenAPI Specifications

### Generating Client SDKs

You can use tools like [OpenAPI Generator](https://openapi-generator.tech/) to generate client SDKs from your OpenAPI specification:

```bash
npx @openapitools/openapi-generator-cli generate -i openapi-spec.json -g javascript -o ./sdk
```

### Integrating with API Documentation Tools

The generated OpenAPI specification can be used with documentation tools like:

- **Swagger UI**: Provides interactive documentation
- **ReDoc**: Creates beautifully styled API reference docs
- **Stoplight**: Offers design, documentation and testing tools

### Creating a REST API Wrapper

You can implement a REST API server that follows the OpenAPI specification and forwards requests to the actual blockchain:

```javascript
const express = require('express');
const { ethers } = require('ethers');
const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('./openapi-spec.json');

const app = express();
app.use(express.json());

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Setup Ethereum provider and contract
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
const contractAddress = '0xYourContractAddress';
const contractAbi = require('./contract-abi.json');
const contract = new ethers.Contract(contractAddress, contractAbi, provider);

// Example endpoint for a view function
app.get('/totalSupply', async (req, res) => {
  try {
    const result = await contract.totalSupply();
    res.json({ 0: result.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example endpoint for a function with parameters
app.post('/transfer', async (req, res) => {
  try {
    const { recipient, amount } = req.body;
    // For this to work, you'd need a signer with private key
    const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
    const contractWithSigner = contract.connect(wallet);
    const tx = await contractWithSigner.transfer(recipient, amount);
    await tx.wait();
    res.json({ 0: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('API server running on http://localhost:3000');
});
```