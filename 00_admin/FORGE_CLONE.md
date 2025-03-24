# Install Foundry (if not installed)
Run curl -L https://foundry.paradigm.xyz | bash
Run foundryup

# Clone a verified contract
Run forge clone <contract_address> <target_directory>
Example: forge clone 0x752D55d62a94658eac08eaE42dEda902b69B0E76 02_FOBXX

# Clone additional contracts
Run forge clone <new_contract_address> <new_target_directory>
Example: forge clone 0xABCDEF1234567890 03_NewContract

# Isolate dependencies (optional)
Move .gitmodules into project directory
Create .git folder in project directory

# Verify cloning
Check source files in <target_directory>/src
Review .clone.meta for contract information