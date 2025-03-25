# API Usage Examples

## Checking Token Information

```bash
# Get basic token information
curl http://localhost:5000/api/token
```

## Working with Accounts

```bash
# Get account balance and status
curl http://localhost:5000/api/account/0x1234567890123456789012345678901234567890

# Transfer tokens 
curl -X POST http://localhost:5000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"to":"0x1234567890123456789012345678901234567890","amount":"10.5"}'
```

## Admin Operations

```bash
# Mint new tokens
curl -X POST http://localhost:5000/api/mint \
  -H "Content-Type: application/json" \
  -d '{"to":"0x1234567890123456789012345678901234567890","amount":"100"}'

# Pause the contract
curl -X POST http://localhost:5000/api/pause

# Unpause the contract
curl -X POST http://localhost:5000/api/unpause

# Block an account
curl -X POST http://localhost:5000/api/block \
  -H "Content-Type: application/json" \
  -d '{"account":"0x1234567890123456789012345678901234567890"}'
```

## Role Management

```bash
# Check if account has a role
curl http://localhost:5000/api/has-role/0x1234567890123456789012345678901234567890/MINTER_ROLE

# Grant a role
curl -X POST http://localhost:5000/api/grant-role \
  -H "Content-Type: application/json" \
  -d '{"account":"0x1234567890123456789012345678901234567890","role":"MINTER_ROLE"}'

# Revoke a role
curl -X POST http://localhost:5000/api/revoke-role \
  -H "Content-Type: application/json" \
  -d '{"account":"0x1234567890123456789012345678901234567890","role":"MINTER_ROLE"}'
```

## Transaction Details

```bash
# Get transaction details
curl http://localhost:5000/api/transaction/0x1234567890123456789012345678901234567890123456789012345678901234
```