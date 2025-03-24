
#!/bin/bash

# Check if we're connected to the remote repository
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "Remote 'origin' not found. Adding remote..."
    git remote add origin https://github.com/0xe184d6c/xft-deploy-monorepo-001.git
else
    CURRENT_REMOTE=$(git remote get-url origin)
    if [ "$CURRENT_REMOTE" != "https://github.com/0xe184d6c/xft-deploy-monorepo-001.git" ]; then
        echo "Updating remote URL..."
        git remote set-url origin https://github.com/0xe184d6c/xft-deploy-monorepo-001.git
    fi
fi

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
