# API Endpoints

## Read Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/token` | GET | Token info (name, symbol, supply, state) |
| `/api/account/:address` | GET | Account balance and status |
| `/api/has-role/:account/:role` | GET | Role verification |
| `/api/transaction/:txHash` | GET | Transaction details |

## Write Endpoints

| Endpoint | Method | Required Role | Purpose |
|----------|--------|--------------|---------|
| `/api/transfer` | POST | Any | Send tokens |
| `/api/mint` | POST | MINTER | Create tokens |
| `/api/burn` | POST | BURNER | Destroy tokens |
| `/api/pause` | POST | PAUSE | Disable transfers |
| `/api/unpause` | POST | PAUSE | Enable transfers |
| `/api/block` | POST | BLOCKLIST | Block account |
| `/api/unblock` | POST | BLOCKLIST | Unblock account |
| `/api/reward-multiplier` | POST | ORACLE | Update reward rate |
| `/api/grant-role` | POST | ADMIN | Assign permission |
| `/api/revoke-role` | POST | ADMIN | Remove permission |

## Request Examples

### Transfer Tokens
```json
POST /api/transfer
{
  "to": "0x123...",
  "amount": "10.5"
}
```

### Mint Tokens
```json
POST /api/mint
{
  "to": "0x123...",
  "amount": "100"
}
```

### Grant Role
```json
POST /api/grant-role
{
  "account": "0x123...",
  "role": "MINTER_ROLE"
}
```

## Response Format
All write operations return:
```json
{
  "success": true,
  "transactionHash": "0x123..."
}
```