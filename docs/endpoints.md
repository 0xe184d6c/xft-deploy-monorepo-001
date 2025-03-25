# API Endpoints

## Read Endpoints

### Get Token Info
```
GET /api/token
```

Returns basic token information including name, symbol, total supply, and paused status.

**Response:**
```json
{
  "name": "XFT Digital Dollar",
  "symbol": "USDX",
  "decimals": "18",
  "totalSupply": "1000000000000000000000", 
  "totalShares": "1000000000000000000000",
  "rewardMultiplier": "1000000000000000000",
  "isPaused": false
}
```

### Get Account Info
```
GET /api/account/:address
```

Returns account balance and status.

**Parameters:**
- `address`: Ethereum address (0x format)

**Response:**
```json
{
  "address": "0x123...",
  "balance": "100000000000000000000",
  "shares": "100000000000000000000",
  "isBlocked": false
}
```

### Check Role
```
GET /api/has-role/:account/:role
```

Checks if an account has a specific role.

**Parameters:**
- `account`: Ethereum address (0x format)
- `role`: Role name (DEFAULT_ADMIN_ROLE, MINTER_ROLE, etc.)

**Response:**
```json
{
  "account": "0x123...",
  "role": "MINTER_ROLE",
  "hasRole": true
}
```

### Get Transaction
```
GET /api/transaction/:txHash
```

Returns details for a transaction.

**Parameters:**
- `txHash`: Transaction hash (0x format)

**Response:**
```json
{
  "hash": "0x123...",
  "from": "0x456...",
  "to": "0x789...",
  "value": "0",
  "blockNumber": 123456,
  "blockHash": "0xabc...",
  "timestamp": 1678901234,
  "status": "success",
  "gasUsed": "21000"
}
```

## Write Endpoints

### Transfer Tokens
```
POST /api/transfer
```

Transfers tokens from server wallet to destination address.

**Request Body:**
```json
{
  "to": "0x123...",
  "amount": "10.5"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "from": "0x456...",
  "to": "0x123...",
  "amount": "10.5"
}
```

### Mint Tokens
```
POST /api/mint
```

Mints new tokens to address (requires MINTER_ROLE).

**Request Body:**
```json
{
  "to": "0x123...",
  "amount": "100"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "to": "0x123...",
  "amount": "100"
}
```

### Burn Tokens
```
POST /api/burn
```

Burns tokens from address (requires BURNER_ROLE).

**Request Body:**
```json
{
  "from": "0x123...",
  "amount": "50"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "from": "0x123...",
  "amount": "50"
}
```

### Pause Contract
```
POST /api/pause
```

Pauses all token transfers (requires PAUSE_ROLE).

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123..."
}
```

### Unpause Contract
```
POST /api/unpause
```

Unpauses token transfers (requires PAUSE_ROLE).

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123..."
}
```

### Block Account
```
POST /api/block
```

Blocks an account from transfers (requires BLOCKLIST_ROLE).

**Request Body:**
```json
{
  "account": "0x123..."
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "account": "0x123..."
}
```

### Unblock Account
```
POST /api/unblock
```

Unblocks an account (requires BLOCKLIST_ROLE).

**Request Body:**
```json
{
  "account": "0x123..."
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "account": "0x123..."
}
```

### Update Reward Multiplier
```
POST /api/reward-multiplier
```

Updates reward multiplier (requires ORACLE_ROLE).

**Request Body:**
```json
{
  "value": "1.2"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "newValue": "1.2"
}
```

### Grant Role
```
POST /api/grant-role
```

Grants role to account (requires DEFAULT_ADMIN_ROLE).

**Request Body:**
```json
{
  "account": "0x123...",
  "role": "MINTER_ROLE"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "account": "0x123...",
  "role": "MINTER_ROLE"
}
```

### Revoke Role
```
POST /api/revoke-role
```

Revokes role from account (requires DEFAULT_ADMIN_ROLE).

**Request Body:**
```json
{
  "account": "0x123...",
  "role": "MINTER_ROLE"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "account": "0x123...",
  "role": "MINTER_ROLE"
}
```