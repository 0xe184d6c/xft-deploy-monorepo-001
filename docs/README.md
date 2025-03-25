# USDX Token API Documentation

API for interacting with USDX token smart contract on Sepolia testnet.

## Base URL

```
/api
```

## Authentication

Currently no authentication required. Server uses private key to sign transactions.

## Response Format

All responses are JSON with the following structure:

```json
// Success response
{
  "success": true,
  "transactionHash": "0x...",
  ...
}

// Error response
{
  "error": "Error message"
}
```