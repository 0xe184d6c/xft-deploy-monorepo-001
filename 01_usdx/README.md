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


Foundry Project Setup for USDX
Directory Structure
I've created the standard Foundry project structure:

src/ - Contains contract source files
test/ - Contains test files
script/ - Contains deployment scripts
lib/ - Will hold dependencies (when installed with Forge)
Configuration Files
foundry.toml:

Configured compiler settings (Solidity 0.8.19)
Set up source, test, and output directories
Added RPC endpoints configuration for various networks
Added Etherscan API configuration for contract verification
remappings.txt:

Added standard remappings for OpenZeppelin contracts
Set up forge-std and ds-test remappings for testing
.env.example:

Template for environment variables such as RPC URLs, API keys, and private keys
(User should create an actual .env file from this template)
.gitignore:

Set up to ignore Foundry build artifacts
Ignores environment files and dependencies
Smart Contract
Created the USDX.sol contract with features:

ERC20 functionality
Role-based access control
Blocklisting capability
Pausable functionality
Reward multiplier mechanism
Testing
Created a comprehensive test file (USDX.t.sol) that tests:

Initial contract state
Minting and burning
Token transfers
Reward multiplier adjustments
Blocklisting functionality
Pausing functionality
Share calculations
Deployment
Created a deployment script (DeployUSDX.s.sol) that:

Reads private key from environment variables
Deploys the USDX contract
Returns the deployed contract instance
Documentation
Added a README.md with:

Project overview
Feature list
Setup instructions
Testing and deployment instructions
Next Steps
Once Foundry is properly installed, you'll need to:

Run forge install to fetch dependencies (OpenZeppelin contracts, forge-std)
Create a .env file based on the example
Run tests with forge test
When you're ready to deploy:

Set the appropriate environment variables
Run the deployment script with forge script script/DeployUSDX.s.sol --rpc-url $RPC_URL --broadcast