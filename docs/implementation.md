# API Implementation Details

## Configuration

### Environment Variables

Required environment variables:

- `PRIVATE_KEY` - Private key for sending transactions
- `ALCHEMY_API_KEY` - Alchemy API key for Sepolia network access

### Network Config

- Network: Sepolia Testnet (chainId: 11155111)
- Token: XFT Digital Dollar (USDX)
- Proxy: 0x421C76cd7C1550c4fcc974F4d74c870150c45995  
- Implementation: 0xf6080682dFCa67A25F294343a03C8cd8675cc41E

## Contract Interface

The API interacts with an upgradeable USDX token contract that implements:

- ERC20 token standard
- Access control (OpenZeppelin)
- Pausable functionality
- Blocklist capability
- Share-based internal accounting

## Error Handling

All API endpoints return errors in consistent format:

```json
{
  "error": "Detailed error message"
}
```

Common error status codes:
- 400: Invalid request parameters
- 401: Unauthorized (role required)
- 500: Contract execution error

## Initialization

Contract connection is initialized when server starts:

```typescript
// Initialize contract when server starts
try {
  await contractService.initializeContract();
  console.log("Smart contract initialized successfully");
} catch (error) {
  console.error("Failed to initialize smart contract:", error);
}
```