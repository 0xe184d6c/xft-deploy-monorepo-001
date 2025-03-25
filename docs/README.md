# USDX Token API

REST API for the XFT Digital Dollar (USDX) smart contract on Sepolia testnet.

## Quick Start

1. Set environment variables:
   ```
   PRIVATE_KEY=your_wallet_private_key
   ALCHEMY_API_KEY=your_alchemy_api_key
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start server:
   ```
   npm run dev
   ```

4. API runs at:
   ```
   http://localhost:5000/api
   ```

## Features

- Token information retrieval
- Balance checking
- Token transfers
- Administrative functions (mint, burn, pause)
- Role management
- Account blocklisting
- Reward multiplier updates

## Documentation

- [API Endpoints](endpoints.md)
- [Implementation Details](implementation.md)
- [Usage Examples](examples.md)
- [Role System](roles.md)
- [Testing Guide](testing.md)

## Requirements

- Node.js 18+
- Wallet with Sepolia ETH
- Alchemy API account