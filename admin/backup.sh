
#!/bin/bash

# Get current timestamp with time
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BRANCH_NAME="mono-repl-$TIMESTAMP"

# Create and checkout new branch
git checkout -b $BRANCH_NAME

# Add all changes
git add .

# Commit changes
git commit -m "Hardhat Mono Repl Backup $TIMESTAMP"

# Push to remote
git push origin $BRANCH_NAME
