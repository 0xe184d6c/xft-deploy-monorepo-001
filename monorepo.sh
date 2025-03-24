#!/bin/bash

# Monorepo management script for Hardhat projects
# Usage: ./monorepo.sh [command] [project]

set -e

function show_help {
  echo "Monorepo Management Script"
  echo ""
  echo "Usage: ./monorepo.sh [command] [project]"
  echo ""
  echo "Commands:"
  echo "  setup         Install dependencies for all projects"
  echo "  compile       Compile contracts for specified project or all"
  echo "  test          Run tests for specified project or all"
  echo "  deploy        Deploy contracts for specified project or all"
  echo "  clean         Remove artifacts and cache"
  echo "  help          Show this help message"
  echo ""
  echo "Projects:"
  echo "  a             Project A"
  echo "  b             Project B"
  echo "  all           All projects (default)"
  echo ""
  echo "Examples:"
  echo "  ./monorepo.sh setup"
  echo "  ./monorepo.sh compile all"
  echo "  ./monorepo.sh test a"
  echo "  ./monorepo.sh deploy b"
  echo "  ./monorepo.sh clean all"
}

# Default project is 'all' if not specified
PROJECT=${2:-all}

case $1 in
  setup)
    echo "Setting up all projects..."
    cd project-a && npm install
    cd ../project-b && npm install
    echo "Setup complete."
    ;;
    
  compile)
    if [ "$PROJECT" == "a" ] || [ "$PROJECT" == "all" ]; then
      echo "Compiling project-a..."
      cd project-a && echo "y" | npm run compile
    fi
    
    if [ "$PROJECT" == "b" ] || [ "$PROJECT" == "all" ]; then
      echo "Compiling project-b..."
      cd $([ "$PROJECT" == "all" ] && echo "../project-b" || echo "project-b") && echo "y" | npm run compile
    fi
    
    echo "Compilation complete."
    ;;
    
  test)
    if [ "$PROJECT" == "a" ] || [ "$PROJECT" == "all" ]; then
      echo "Testing project-a..."
      cd project-a && echo "y" | npx hardhat test
    fi
    
    if [ "$PROJECT" == "b" ] || [ "$PROJECT" == "all" ]; then
      echo "Testing project-b..."
      cd $([ "$PROJECT" == "all" ] && echo "../project-b" || echo "project-b") && echo "y" | npx hardhat test
    fi
    
    echo "Tests complete."
    ;;
    
  deploy)
    if [ "$PROJECT" == "a" ] || [ "$PROJECT" == "all" ]; then
      echo "Deploying project-a..."
      cd project-a && echo "y" | npx hardhat run scripts/deploy.js
    fi
    
    if [ "$PROJECT" == "b" ] || [ "$PROJECT" == "all" ]; then
      echo "Deploying project-b..."
      cd $([ "$PROJECT" == "all" ] && echo "../project-b" || echo "project-b") && echo "y" | npx hardhat run scripts/deploy.js
    fi
    
    echo "Deployment complete."
    ;;
    
  clean)
    echo "Cleaning build artifacts..."
    rm -rf project-a/artifacts project-b/artifacts project-a/cache project-b/cache
    echo "Clean complete."
    ;;
    
  help|*)
    show_help
    ;;
esac