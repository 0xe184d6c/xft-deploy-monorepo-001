// Version management script for CI/CD
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Function to read the current version from package.json
function getCurrentVersion() {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '0.1.0';
  } catch (error) {
    console.error('Error reading package.json:', error);
    return '0.1.0';
  }
}

// Function to bump the version according to semver rules
function bumpVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch(type.toLowerCase()) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// Function to update the version in package.json
function updatePackageJsonVersion(newVersion) {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.version = newVersion;
    
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    
    return true;
  } catch (error) {
    console.error('Error updating package.json:', error);
    return false;
  }
}

// Function to create or update a version.json file
function updateVersionInfo(version) {
  try {
    const versionInfo = {
      version,
      timestamp: new Date().toISOString(),
      buildNumber: process.env.BUILD_NUMBER || 'development',
      environment: process.env.NODE_ENV || 'development'
    };
    
    const versionFilePath = path.join(projectRoot, 'version.json');
    fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2) + '\n');
    
    return true;
  } catch (error) {
    console.error('Error writing version.json:', error);
    return false;
  }
}

// Function to update the changelog
function updateChangelog(version) {
  try {
    const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
    const timestamp = new Date().toISOString().split('T')[0];
    const newEntry = `\n## [${version}] - ${timestamp}\n\n- Update version to ${version}\n`;
    
    let changelog = '';
    if (fs.existsSync(changelogPath)) {
      changelog = fs.readFileSync(changelogPath, 'utf8');
    } else {
      changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n';
    }
    
    // Insert the new entry after the header
    const updatedChangelog = changelog.replace(
      /# Changelog.*?\n\n/s,
      match => `${match}${newEntry}`
    );
    
    fs.writeFileSync(changelogPath, updatedChangelog);
    return true;
  } catch (error) {
    console.error('Error updating CHANGELOG.md:', error);
    return false;
  }
}

// Get current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Main function
function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(versionType)) {
    console.error('Invalid version type. Use: major, minor, or patch');
    process.exit(1);
  }
  
  // Get current version and bump it
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, versionType);
  
  console.log(`Bumping version: ${currentVersion} -> ${newVersion} (${versionType})`);
  
  // Update files
  const packageUpdated = updatePackageJsonVersion(newVersion);
  const versionInfoUpdated = updateVersionInfo(newVersion);
  const changelogUpdated = updateChangelog(newVersion);
  
  if (packageUpdated && versionInfoUpdated && changelogUpdated) {
    console.log(`Version updated to ${newVersion} successfully.`);
    return 0;
  } else {
    console.error('Failed to update one or more files.');
    return 1;
  }
}

// Execute the main function
const exitCode = main();
process.exit(exitCode);