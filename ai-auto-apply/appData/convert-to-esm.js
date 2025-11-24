#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function convertFileToESM(filePath) {
  console.log(`Converting: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Convert require statements to import statements
  // Handle destructuring requires: const { Pool } = require('pg') -> import { Pool } from 'pg'
  content = content.replace(
    /const\s+{\s*([^}]+)\s*}\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (match, imports, module) => {
      modified = true;
      return `import { ${imports} } from '${module}';`;
    }
  );

  // Handle simple requires: const express = require('express') -> import express from 'express'
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (match, importName, module) => {
      modified = true;
      return `import ${importName} from '${module}';`;
    }
  );

  // Handle standalone require calls: require('dotenv').config()
  content = content.replace(
    /require\(['"]([^'"]+)['"]\)\.(\w+)\(\)/g,
    (match, module, method) => {
      modified = true;
      if (module === 'dotenv' && method === 'config') {
        return "import 'dotenv/config';";
      }
      return `import ${module} from '${module}';\n${module}.${method}();`;
    }
  );

  // Handle module.exports = router -> export default router
  content = content.replace(
    /module\.exports\s*=\s*(.+);?/g,
    (match, exportValue) => {
      modified = true;
      return `export default ${exportValue};`;
    }
  );

  // Handle exports.functionName = function -> export function functionName
  content = content.replace(
    /exports\.(\w+)\s*=\s*(.+);?/g,
    (match, exportName, exportValue) => {
      modified = true;
      return `export ${exportName} = ${exportValue};`;
    }
  );

  // Add .js extensions to imports
  content = content.replace(
    /from\s+['"]([^'"]+)['"]/g,
    (match, modulePath) => {
      // Only add .js to relative imports (starting with ./ or ../)
      if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
        if (!modulePath.endsWith('.js')) {
          modified = true;
          return `from '${modulePath}.js'`;
        }
      }
      return match;
    }
  );

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
    return false;
  }
}

function findJSFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function main() {
  console.log('🔄 Converting CommonJS files to ESM...\n');
  
  if (!fs.existsSync(srcDir)) {
    console.error(`❌ Source directory not found: ${srcDir}`);
    process.exit(1);
  }
  
  const jsFiles = findJSFiles(srcDir);
  console.log(`Found ${jsFiles.length} JavaScript files\n`);
  
  let convertedCount = 0;
  
  for (const file of jsFiles) {
    if (convertFileToESM(file)) {
      convertedCount++;
    }
  }
  
  console.log(`\n✅ Conversion complete!`);
  console.log(`📊 Summary: ${convertedCount} files modified out of ${jsFiles.length} total files`);
}

main();
