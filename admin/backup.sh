#!/bin/bash

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d)
BRANCH_NAME="mono-repl-$TIMESTAMP"

# Create and checkout new branch
git checkout -b $BRANCH_NAME

# Add all changes
git add .

# Commit changes
git commit -m "Hardhat Mono Repl Backup $TIMESTAMP"

# Push to remote
git push origin $BRANCH_NAME