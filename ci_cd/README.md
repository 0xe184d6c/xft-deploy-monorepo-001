# CI/CD Tools for USDX Token Dashboard

This directory contains Continuous Integration and Continuous Deployment (CI/CD) tools for the USDX Token Dashboard project. These tools help automate and streamline development, testing, and deployment processes.

## Overview

The CI/CD tools are organized as follows:

- **scripts/**: Contains JavaScript scripts for various CI/CD tasks
- **monitoring/**: Tools for monitoring application health
- **reports/**: Generated reports (created automatically when scripts run)

## Available Tools

### 1. Health Monitoring

The project includes health check endpoints that provide real-time information about the application's status:

- Basic health check: `GET /api/health`
- Detailed health check: `GET /api/health/detailed`

The detailed health check provides information about:
- Blockchain connectivity
- Contract status
- Server status
- System resources

### 2. Version Management

The version management script (`scripts/version.js`) helps maintain consistent versioning following semantic versioning principles:

- Updates `package.json` version
- Creates/updates `version.json` with build information
- Updates `CHANGELOG.md` with version information

### 3. Dependency Health Check

The dependency health check script (`scripts/dep-check.js`) analyzes project dependencies:

- Identifies outdated packages
- Detects potential vulnerabilities
- Generates comprehensive reports

### 4. Project Structure Mapping

The project mapping script (`scripts/project-map.js`) creates a detailed map of the project structure:

- Lists files and directories
- Provides statistics about file types
- Identifies key components

### 5. Deployment Script

The deployment script (`scripts/deploy.js`) automates the deployment process:

- Bumps version
- Checks dependencies
- Tests builds
- Runs tests
- Creates deployment records

## Usage

To use these tools, use the provided runner script:

```bash
./ci_cd/run.sh [command]
```

Available commands:

- **health**: Run health check
- **version [patch|minor|major]**: Update version (defaults to patch)
- **deps**: Check dependencies
- **map**: Generate project structure map
- **deploy**: Run deployment process
- **help**: Show help information

Examples:

```bash
# Run health check
./ci_cd/run.sh health

# Update minor version
./ci_cd/run.sh version minor

# Check dependencies
./ci_cd/run.sh deps

# Generate project map
./ci_cd/run.sh map

# Run deployment process
./ci_cd/run.sh deploy
```

## Reports

Reports are generated in the `reports/` directory when scripts are run:

- Dependency reports: `reports/dependency-report-*.json`
- Project structure maps: `reports/project-map.json` and `reports/project-summary.json`
- Deployment records: `reports/deployments/deploy-*.json`

## Extending the CI/CD Tools

To add new CI/CD functionality:

1. Create a new script in the `scripts/` directory
2. Add a corresponding function to `run.sh`
3. Update this README with documentation

## Best Practices

When using these CI/CD tools:

1. Run health checks before deployment to ensure the system is stable
2. Update version numbers for significant changes following semantic versioning
3. Regularly check dependencies for outdated packages and vulnerabilities
4. Generate project maps after significant restructuring
5. Document all deployments with appropriate version information