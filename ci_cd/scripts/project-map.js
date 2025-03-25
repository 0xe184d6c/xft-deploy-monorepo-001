// Project structure mapping tool
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  excludeDirs: ['node_modules', '.git', '.cache', 'dist'],
  includeExt: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.html'],
  maxDepth: 4, // Maximum directory depth to traverse
};

// Recursively map directory
function mapDirectory(dir, basePath = '', depth = 0) {
  if (depth > CONFIG.maxDepth) {
    return { 
      name: path.basename(dir),
      path: path.join(basePath, path.basename(dir)),
      type: 'directory',
      note: 'Max depth reached'
    };
  }
  
  const result = {
    name: path.basename(dir),
    path: path.join(basePath, path.basename(dir)),
    type: 'directory',
    children: []
  };
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (item.startsWith('.')) continue; // Skip hidden files
      
      const itemPath = path.join(dir, item);
      const relativePath = path.join(basePath, path.basename(dir), item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(item)) {
          const subdirMap = mapDirectory(itemPath, basePath, depth + 1);
          result.children.push(subdirMap);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (CONFIG.includeExt.includes(ext)) {
          result.children.push({
            name: item,
            path: relativePath,
            type: 'file',
            size: stat.size,
            extension: ext
          });
        }
      }
    }
    
    // Count file types for stats
    const fileTypes = {};
    let fileCount = 0;
    let dirCount = 0;
    
    result.children.forEach(item => {
      if (item.type === 'file') {
        fileCount++;
        fileTypes[item.extension] = (fileTypes[item.extension] || 0) + 1;
      } else if (item.type === 'directory') {
        dirCount++;
      }
    });
    
    result.stats = {
      fileCount,
      dirCount,
      fileTypes
    };
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
    result.error = err.message;
  }
  
  return result;
}

// Create a summary of the project structure
function createProjectSummary(projectMap) {
  // Count total files by type across the project
  const fileCounts = {};
  let totalFiles = 0;
  let totalDirs = 0;
  
  function countFiles(node) {
    if (node.type === 'directory' && node.children) {
      totalDirs++;
      node.children.forEach(countFiles);
    } else if (node.type === 'file') {
      totalFiles++;
      const ext = node.extension || 'unknown';
      fileCounts[ext] = (fileCounts[ext] || 0) + 1;
    }
  }
  
  countFiles(projectMap);
  
  // Find key files and directories
  const keyComponents = [
    { name: 'API Routes', pattern: /api\/routes\.ts$/ },
    { name: 'Contract Service', pattern: /api\/contract\.ts$/ },
    { name: 'Server Entry', pattern: /server\/index\.ts$/ },
    { name: 'Client Components', pattern: /client\/src\/components/ },
    { name: 'Client Pages', pattern: /client\/src\/pages/ },
    { name: 'Configuration Files', pattern: /\.config\.(js|ts)$/ }
  ];
  
  const foundComponents = {};
  
  function findKeyComponents(node, path = '') {
    const nodePath = path ? `${path}/${node.name}` : node.name;
    
    keyComponents.forEach(component => {
      if (component.pattern.test(nodePath)) {
        foundComponents[component.name] = foundComponents[component.name] || [];
        foundComponents[component.name].push(nodePath);
      }
    });
    
    if (node.type === 'directory' && node.children) {
      node.children.forEach(child => findKeyComponents(child, nodePath));
    }
  }
  
  findKeyComponents(projectMap);
  
  return {
    summary: {
      totalFiles,
      totalDirectories: totalDirs,
      fileTypes: fileCounts
    },
    keyComponents: foundComponents
  };
}

// Main function
function main() {
  try {
    console.log('Mapping project structure...');
    
    // Map the project structure
    const projectMap = mapDirectory('.');
    
    // Create a summary
    const summary = createProjectSummary(projectMap);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'ci_cd', 'reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write the full map to file
    const mapPath = path.join(outputDir, 'project-map.json');
    fs.writeFileSync(mapPath, JSON.stringify(projectMap, null, 2));
    
    // Write the summary to file
    const summaryPath = path.join(outputDir, 'project-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`Project structure mapped to ${mapPath}`);
    console.log(`Project summary generated at ${summaryPath}`);
    
    // Print a basic summary to console
    console.log('\nProject Summary:');
    console.log(`Total Files: ${summary.summary.totalFiles}`);
    console.log(`Total Directories: ${summary.summary.totalDirectories}`);
    console.log('\nFile Types:');
    Object.entries(summary.summary.fileTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    
    console.log('\nKey Components:');
    Object.entries(summary.keyComponents).forEach(([name, paths]) => {
      console.log(`  ${name}:`);
      paths.forEach(p => console.log(`    - ${p}`));
    });
    
    return 0;
  } catch (error) {
    console.error('Error mapping project structure:', error);
    return 1;
  }
}

// Execute main function
const exitCode = main();
process.exit(exitCode);