# API Testing Guide

## Prerequisites

- Node.js and npm installed
- Private key with sufficient balance on Sepolia
- Alchemy API key for Sepolia network

## Setting Up Environment

Set required environment variables:

```bash
export PRIVATE_KEY=your_private_key
export ALCHEMY_API_KEY=your_alchemy_api_key
```

## Test Flow

### 1. Basic Read Operations

Test read endpoints to ensure server connects correctly:

```bash
# Check token info
curl http://localhost:5000/api/token
```

Expected: Returns token information including name, symbol, total supply.

### 2. Transfer Flow

Test token transfer:

```bash
# Get current balance
curl http://localhost:5000/api/account/0x1234567890123456789012345678901234567890

# Transfer tokens
curl -X POST http://localhost:5000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"to":"0x1234567890123456789012345678901234567890","amount":"1.5"}'

# Verify new balance
curl http://localhost:5000/api/account/0x1234567890123456789012345678901234567890
```

### 3. Admin Operations

For testing admin functions, ensure wallet has appropriate roles:

```bash
# Check role
curl http://localhost:5000/api/has-role/{adminAddress}/DEFAULT_ADMIN_ROLE

# Test minting (requires MINTER_ROLE)
curl -X POST http://localhost:5000/api/mint \
  -H "Content-Type: application/json" \
  -d '{"to":"0x1234567890123456789012345678901234567890","amount":"10"}'
```

## Error Handling

Test error handling with invalid inputs:

```bash
# Invalid address format
curl http://localhost:5000/api/account/0xinvalid

# Invalid amount
curl -X POST http://localhost:5000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"to":"0x1234567890123456789012345678901234567890","amount":"-10"}'
```

Expected: API returns error responses with descriptive messages.