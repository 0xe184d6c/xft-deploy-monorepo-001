
#!/bin/bash

# Set up Git configuration
git config --global user.name "0xe184d6c"
git config --global user.email "0xe184d6c@users.noreply.github.com"

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BRANCH_NAME="dashboard-repl-$TIMESTAMP"

# Create and checkout new branch
git checkout -b $BRANCH_NAME

# Add all changes
git add .

# Commit changes
git commit -m "Dashboard Repl $TIMESTAMP"

# Set the remote URL with token
GITHUB_URL="https://0xe184d6c:$GH_REPL_BACKUP@github.com/0xe184d6c/xft-deploy-monorepo-001.git"

# Remove existing origin if it exists
git remote remove origin || true

# Add new origin with token
git remote add origin $GITHUB_URL

# Push to remote
git push origin $BRANCH_NAME
