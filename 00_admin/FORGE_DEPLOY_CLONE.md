Steps to Deploy Cloned Contract (02_FOBXX)

Set environment variables
Export your RPC URL: export ETH_RPC_URL=your_rpc_url
Export private key: export PRIVATE_KEY=your_private_key
For verification: export ETHERSCAN_API_KEY=your_etherscan_api_key

Navigate to project directory
cd 02_FOBXX

Deploy the contract

Basic deployment:
forge create --rpc-url $ETH_RPC_URL --private-key $PRIVATE_KEY src/YBSV1_1.sol:YBSV1_1

With constructor args (if needed):
forge create --rpc-url $ETH_RPC_URL --private-key $PRIVATE_KEY --constructor-args arg1 arg2 src/YBSV1_1.sol:YBSV1_1
With verification:
forge create --rpc-url $ETH_RPC_URL --private-key $PRIVATE_KEY --verify --etherscan-api-key $ETHERSCAN_API_KEY src/YBSV1_1.sol:YBSV1_1
Verify later if needed

forge verify-contract --chain-id CHAIN_ID --watch --etherscan-api-key $ETHERSCAN_API_KEY CONTRACT_ADDRESS src/YBSV1_1.sol:YBSV1_1