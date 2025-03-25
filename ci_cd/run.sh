#!/bin/bash

# CI/CD Task Runner Script
# This script provides a command-line interface to run CI/CD tasks

# Set up colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  USDX Token Dashboard CI/CD Tools   ${NC}"
echo -e "${BLUE}=====================================${NC}"

# Function to display help message
show_help() {
  echo -e "\n${YELLOW}Usage:${NC} ./ci_cd/run.sh [command]"
  echo
  echo -e "${YELLOW}Available commands:${NC}"
  echo -e "  ${GREEN}health${NC}      - Run health check"
  echo -e "  ${GREEN}version${NC}     - Update version (patch, minor, major)"
  echo -e "  ${GREEN}deps${NC}        - Check dependencies"
  echo -e "  ${GREEN}map${NC}         - Generate project structure map"
  echo -e "  ${GREEN}deploy${NC}      - Run deployment process"
  echo -e "  ${GREEN}help${NC}        - Show this help message"
  echo
  echo -e "${YELLOW}Examples:${NC}"
  echo -e "  ./ci_cd/run.sh health"
  echo -e "  ./ci_cd/run.sh version patch"
  echo -e "  ./ci_cd/run.sh deploy"
  echo
}

# Function to run health check
run_health_check() {
  echo -e "${BLUE}Running health check...${NC}"
  
  # Check if curl is available
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed. Cannot perform health check.${NC}"
    return 1
  fi
  
  # Basic health check
  echo -e "${YELLOW}Basic health check:${NC}"
  HEALTH_RESULT=$(curl -s http://localhost:5000/api/health)
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not connect to health endpoint.${NC}"
    echo -e "${RED}Make sure the application is running.${NC}"
    return 1
  fi
  
  echo -e "${GREEN}$HEALTH_RESULT${NC}"
  
  # Detailed health check
  echo -e "\n${YELLOW}Detailed health check:${NC}"
  DETAILED_RESULT=$(curl -s http://localhost:5000/api/health/detailed)
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not connect to detailed health endpoint.${NC}"
    return 1
  fi
  
  echo -e "${GREEN}$DETAILED_RESULT${NC}"
  
  echo -e "\n${GREEN}Health check completed.${NC}"
}

# Function to update version
update_version() {
  local VERSION_TYPE=$1
  
  if [ -z "$VERSION_TYPE" ]; then
    VERSION_TYPE="patch"
  fi
  
  if [[ "$VERSION_TYPE" != "patch" && "$VERSION_TYPE" != "minor" && "$VERSION_TYPE" != "major" ]]; then
    echo -e "${RED}Error: Invalid version type. Use 'patch', 'minor', or 'major'.${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Updating version (${VERSION_TYPE})...${NC}"
  node ./ci_cd/scripts/version.js ${VERSION_TYPE}
}

# Function to check dependencies
check_dependencies() {
  echo -e "${BLUE}Checking dependencies...${NC}"
  node ./ci_cd/scripts/dep-check.js
}

# Function to generate project structure map
map_project() {
  echo -e "${BLUE}Generating project structure map...${NC}"
  node ./ci_cd/scripts/project-map.js
}

# Function to run deployment process
run_deployment() {
  echo -e "${BLUE}Running deployment process...${NC}"
  node ./ci_cd/scripts/deploy.js
}

# Main command processing
case "$1" in
  health)
    run_health_check
    ;;
  version)
    update_version "$2"
    ;;
  deps)
    check_dependencies
    ;;
  map)
    map_project
    ;;
  deploy)
    run_deployment
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$1'${NC}"
    show_help
    exit 1
    ;;
esac

exit $?