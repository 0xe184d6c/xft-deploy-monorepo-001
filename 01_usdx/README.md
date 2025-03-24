# USDX - Extended USD Stablecoin

USDX is an ERC20-compatible stablecoin with advanced features like reward multipliers, blocklisting, and pausable functionality.

## Features

- **ERC20 Compliance**: Full compatibility with the ERC20 standard
- **Reward Multiplier**: Dynamic reward mechanism that can be adjusted by authorized oracles
- **Blocklisting**: Ability to block malicious accounts from transacting
- **Pausable**: Emergency pause functionality to stop all transfers when necessary
- **Role-Based Access Control**: Different permission levels for various operations

## Project Structure

- `src/`: Smart contract source files
- `test/`: Test files for the contracts
- `script/`: Deployment and other scripts
- `lib/`: Dependencies (managed by Forge)

## Development

This project uses [Foundry](https://book.getfoundry.sh/) for development and testing.

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   forge install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials

### Testing

Run the tests with:

```bash
forge test
```

For more verbose output:

```bash
forge test -vvv
```

### Deployment

To deploy to a network:

1. Set up your `.env` file with the appropriate network RPC URL and private key
2. Run the deployment script:
   ```bash
   forge script script/DeployUSDX.s.sol --rpc-url $RPC_URL --broadcast --verify
   ```

## License

This project is licensed under the MIT License.