
npx hardhat run scripts/03_roles.ts --network sepolia
npx hardhat run scripts/03_roles.ts --network localhost



Loads the latest deployment information
Connects to the deployed USDX contract
Grants various roles to specified addresses
Verifies the role assignments













Loading Deployment Information:

It finds the most recent deployment file for the current network
Extracts the contract address and owner information
Connecting to the Contract:

Uses Hardhat's ethers integration to connect to the deployed USDX proxy contract
Role Configuration:

Defines six different roles from the USDX contract:
MINTER_ROLE: Addresses authorized to mint new tokens
BURNER_ROLE: Addresses authorized to burn tokens
ORACLE_ROLE: Addresses that can update the reward multiplier
PAUSE_ROLE: Addresses that can pause/unpause the contract
BLOCKLIST_ROLE: Addresses that can block/unblock other addresses
UPGRADE_ROLE: Addresses that can upgrade the contract implementation
Role Assignment Process:

Verifies the owner has the DEFAULT_ADMIN_ROLE first
For each role, it checks if addresses already have the role
Grants the role if needed using grantRole() function
Displays the transaction hash for successful assignments
Verification:

Performs a verification check after all assignments
Confirms each address has its assigned roles
Provides a summary of the role assignments
Important Note
The example addresses in the script should be replaced with actual addresses before running it in production. These are placeholder addresses for demonstration purposes only.

Command to Run the Script
To run the script on the Sepolia test network:

npx hardhat run scripts/03_roles.ts --network sepolia
To run the script on a local development network:

npx hardhat run scripts/03_roles.ts --network localhost
You'll need to edit the script to replace the example addresses with actual addresses before running it on a real network. These addresses should be the wallets or contracts that need the specific roles to interact with the USDX token.