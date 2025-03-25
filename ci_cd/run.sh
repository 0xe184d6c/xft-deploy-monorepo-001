#!/bin/bash

# Define color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Header function
print_header() {
  echo -e "${BLUE}====================================="
  echo -e "  USDX Token Dashboard CI/CD Tools   "
  echo -e "=====================================${NC}"
}

# Error handling function
handle_error() {
  echo -e "${RED}Error: $1${NC}"
  exit 1
}

# Function to run a command with error handling
run_command() {
  "$@"
  local status=$?
  if [ $status -ne 0 ]; then
    handle_error "Command '$*' failed with status $status"
  fi
  return $status
}

# Health check function
run_health_check() {
  echo -e "Running health check..."
  
  # Basic health check
  echo -e "${YELLOW}Basic health check:${NC}"
  curl -s http://localhost:5000/api/health | node -e "process.stdin.on('data', data => console.log(JSON.stringify(JSON.parse(data.toString()), null, 2)))"
  echo ""
  
  # Detailed health check  
  echo -e "${YELLOW}Detailed health check:${NC}"
  curl -s http://localhost:5000/api/health/detailed | node -e "process.stdin.on('data', data => console.log(JSON.stringify(JSON.parse(data.toString()), null, 2)))"
  echo ""
  
  echo -e "${GREEN}Health check completed.${NC}"
}

# Version bump function
run_version_bump() {
  local version_type=${1:-"patch"}
  
  echo -e "Updating version (${version_type})..."
  run_command node ci_cd/scripts/version.js "$version_type"
  
  echo -e "${GREEN}Version updated successfully.${NC}"
}

# Dependency check function
run_dependency_check() {
  echo -e "Checking dependencies..."
  run_command node ci_cd/scripts/dep-check.js
  
  echo -e "${GREEN}Dependency check completed.${NC}"
}

# Project map function
run_project_map() {
  echo -e "Generating project structure map..."
  run_command node ci_cd/scripts/project-map.js
  
  echo -e "${GREEN}Project map generated successfully.${NC}"
}

# Deployment function
run_deployment() {
  echo -e "Starting deployment process..."
  run_command node ci_cd/scripts/deploy.js
  
  echo -e "${GREEN}Deployment completed successfully.${NC}"
}

# Help function
show_help() {
  echo -e "USDX Token Dashboard CI/CD Tools"
  echo -e "Usage: ./ci_cd/run.sh [command] [options]"
  echo -e ""
  echo -e "Commands:"
  echo -e "  health                 Run health check"
  echo -e "  version [type]         Update version (patch, minor, major). Default: patch"
  echo -e "  deps                   Check dependencies"
  echo -e "  map                    Generate project structure map"
  echo -e "  deploy                 Run deployment process"
  echo -e "  help                   Show this help message"
  echo -e ""
  echo -e "Examples:"
  echo -e "  ./ci_cd/run.sh health"
  echo -e "  ./ci_cd/run.sh version minor"
  echo -e "  ./ci_cd/run.sh deploy"
}

# Ensure reports directory exists
ensure_reports_dir() {
  mkdir -p ci_cd/reports
  echo -e "Ensured reports directory exists."
}

# Main execution
print_header

# Ensure the reports directory exists
ensure_reports_dir

# Check if command is provided
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

# Parse command
command=$1
shift

case $command in
  health)
    run_health_check
    ;;
  version)
    run_version_bump "$1"
    ;;
  deps)
    run_dependency_check
    ;;
  map)
    run_project_map
    ;;
  deploy)
    run_deployment
    ;;
  help)
    show_help
    ;;
  *)
    handle_error "Unknown command: $command"
    ;;
esac

exit 0