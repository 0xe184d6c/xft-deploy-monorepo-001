// Dependency health check script
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read package.json
function getPackageJson() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.error('Error reading package.json:', error);
    return { dependencies: {}, devDependencies: {} };
  }
}

// Function to get outdated packages
function getOutdatedPackages() {
  try {
    console.log('Checking for outdated dependencies...');
    const output = execSync('npm outdated --json', { encoding: 'utf8' });
    return JSON.parse(output || '{}');
  } catch (error) {
    // npm outdated returns non-zero exit code if packages are outdated
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (e) {
        return {};
      }
    }
    console.error('Error checking outdated packages:', error);
    return {};
  }
}

// Function to check for vulnerabilities
function getVulnerabilities() {
  try {
    console.log('Checking for vulnerabilities...');
    const output = execSync('npm audit --json', { encoding: 'utf8' });
    return JSON.parse(output || '{"vulnerabilities":{}}').vulnerabilities;
  } catch (error) {
    // npm audit returns non-zero exit code if vulnerabilities are found
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        return auditData.vulnerabilities || {};
      } catch (e) {
        return { error: 'Failed to parse audit results' };
      }
    }
    console.error('Error checking vulnerabilities:', error);
    return { error: 'Failed to run npm audit' };
  }
}

// Function to generate a dependency report
function generateDependencyReport() {
  const packageJson = getPackageJson();
  const dependencies = { 
    ...packageJson.dependencies || {}, 
    ...packageJson.devDependencies || {} 
  };
  
  const outdatedPackages = getOutdatedPackages();
  const vulnerabilities = getVulnerabilities();
  
  const report = {
    timestamp: new Date().toISOString(),
    dependencyCounts: {
      total: Object.keys(dependencies).length,
      outdated: Object.keys(outdatedPackages).length,
      vulnerabilities: typeof vulnerabilities === 'object' 
        ? Object.keys(vulnerabilities).length 
        : 0
    },
    outdatedPackages: outdatedPackages,
    vulnerabilities: vulnerabilities,
  };
  
  return report;
}

// Function to write report to file
function writeReport(report) {
  try {
    const reportsDir = path.join(process.cwd(), 'ci_cd', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(reportsDir, `dependency-report-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Dependency report saved to ${reportPath}`);
    
    // Also save a latest.json for easy access
    const latestPath = path.join(reportsDir, 'dependency-report-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error writing dependency report:', error);
    return false;
  }
}

// Function to log a summary to console
function logSummary(report) {
  console.log('\n--- Dependency Health Summary ---');
  console.log(`Total dependencies: ${report.dependencyCounts.total}`);
  console.log(`Outdated packages: ${report.dependencyCounts.outdated}`);
  console.log(`Vulnerabilities found: ${report.dependencyCounts.vulnerabilities}`);
  
  if (report.dependencyCounts.outdated > 0) {
    console.log('\nOutdated packages:');
    Object.keys(report.outdatedPackages).forEach(pkg => {
      const info = report.outdatedPackages[pkg];
      console.log(`  ${pkg}: ${info.current} → ${info.latest}`);
    });
  }
  
  if (report.dependencyCounts.vulnerabilities > 0) {
    console.log('\nVulnerabilities detected! Check the full report for details.');
  }
  
  console.log('\nFull report saved to ci_cd/reports/');
}

// Main function
function main() {
  try {
    console.log('Generating dependency health report...');
    const report = generateDependencyReport();
    const success = writeReport(report);
    
    if (success) {
      logSummary(report);
      return 0;
    } else {
      console.error('Failed to generate dependency report.');
      return 1;
    }
  } catch (error) {
    console.error('Error in dependency check:', error);
    return 1;
  }
}

// Execute main function as an IIFE for ES modules
(async () => {
  const exitCode = main();
  process.exit(exitCode);
})();