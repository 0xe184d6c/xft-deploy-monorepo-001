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

### Compilation

You can compile both projects with the provided script:

```bash
# Make sure the script is executable
chmod +x compile-all.sh

# Run the compilation script
./compile-all.sh
```

Or compile each project separately:

```bash
# Compile project-a
cd project-a
npm run compile

# Compile project-b
cd project-b
npm run compile
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

## Available Workflows

This monorepo comes with several pre-configured workflows to help you work efficiently:

- **Setup All Projects**: Installs dependencies for both projects
- **Compile All**: Runs the compile-all.sh script to compile both projects
- **Compile All Projects**: Compiles both projects directly
- **Simple Monorepo Tests**: Runs tests for both projects
- **Test All Projects**: Compiles and tests both projects
- **Test Project A**: Compiles and tests project-a only
- **Test Project B**: Compiles and tests project-b only
- **Deploy Project A**: Deploys the Storage1 contract from project-a
- **Deploy Project B**: Deploys the Storage2 contract from project-b
- **Clean All Projects**: Removes artifacts and cache directories from both projects

## License

MIT