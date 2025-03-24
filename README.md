# Simple Hardhat Monorepo

This is a minimal monorepo structure hosting two independent Hardhat projects with simple Solidity contracts.

## Project Structure

```
.
├── project-a            # First Hardhat project
│   ├── contracts        # Solidity contracts
│   │   └── Storage1.sol # Simple storage contract
│   ├── test             # Test files
│   ├── scripts          # Deployment scripts
│   └── hardhat.config.js # Project-specific Hardhat configuration
└── project-b            # Second Hardhat project
    ├── contracts        # Solidity contracts
    │   └── Storage2.sol # Simple storage contract
    ├── test             # Test files
    ├── scripts          # Deployment scripts
    └── hardhat.config.js # Project-specific Hardhat configuration
```

## Features

- **Independent Projects**: Each project has its own dependencies, configuration, and contracts
- **Simple Contracts**: Basic storage contracts demonstrating minimal functionality
- **Separate Testing**: Each project maintains its own test suite
- **Independent Deployment**: Project-specific deployment scripts

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository

2. Install root dependencies (if any):

```bash
npm install
```

3. Install project-a dependencies:

```bash
cd project-a
npm install
```

4. Install project-b dependencies:

```bash
cd project-b
npm install
```

### Testing

Run tests for project-a:

```bash
cd project-a
npx hardhat test
```

Run tests for project-b:

```bash
cd project-b
npx hardhat test
```

Or run all tests via the workflow:

```bash
cd project-a && npm install --no-audit --no-fund && npx hardhat test && cd ../project-b && npm install --no-audit --no-fund && npx hardhat test
```

### Deployment

To deploy contracts for project-a:

```bash
cd project-a
npx hardhat run scripts/deploy.js
```

To deploy contracts for project-b:

```bash
cd project-b
npx hardhat run scripts/deploy.js
```

## License

MIT