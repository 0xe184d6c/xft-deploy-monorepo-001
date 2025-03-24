
#!/bin/bash

# Usage: ./setup-hardhat.sh <project-name>
PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
  echo "Please provide a project name"
  exit 1
fi

# Create project directory
mkdir -p $PROJECT_NAME

# Copy base configuration files
cp project-a/tsconfig.json $PROJECT_NAME/
cp project-a/hardhat.config.ts $PROJECT_NAME/

# Create project structure
mkdir -p $PROJECT_NAME/contracts
mkdir -p $PROJECT_NAME/scripts
mkdir -p $PROJECT_NAME/test

# Initialize package.json
cd $PROJECT_NAME
npm init -y

# Update package.json with required scripts and dependencies
npm pkg set scripts.compile="hardhat compile"
npm pkg set scripts.test="hardhat test"
npm pkg set scripts.deploy="hardhat run scripts/deploy.ts"
npm pkg set scripts.typechain="hardhat typechain"

# Install dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox@^2.0.0 @openzeppelin/contracts@^4.8.0 @types/chai@^4.3.1 @types/mocha@^9.1.1 @types/node@^18.0.0 chai@^4.3.6 dotenv@^16.0.3 hardhat@^2.12.6 ts-node@^10.8.2 typescript@^4.7.4

echo "Project $PROJECT_NAME has been set up successfully!"
