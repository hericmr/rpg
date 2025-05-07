const fs = require('fs-extra');
const path = require('path');

const sourceDir = path.join(__dirname, '../src/assets');
const targetDir = path.join(__dirname, '../public/assets');

// Ensure target directory exists
fs.ensureDirSync(targetDir);

// Copy all assets
fs.copySync(sourceDir, targetDir, {
  overwrite: true,
  filter: (src) => {
    // Don't copy TypeScript files
    return !src.endsWith('.ts');
  }
});

console.log('Assets copied successfully!');

// If we're in development mode, also copy to the build directory
if (process.env.NODE_ENV === 'development') {
  const buildDir = path.join(__dirname, '../build/assets');
  fs.ensureDirSync(buildDir);
  fs.copySync(sourceDir, buildDir, {
    overwrite: true,
    filter: (src) => !src.endsWith('.ts')
  });
  console.log('Assets copied to build directory for development!');
} 