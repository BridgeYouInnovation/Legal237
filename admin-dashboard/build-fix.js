const fs = require('fs');
const path = require('path');

console.log('Checking AJV installation...');

try {
  // Check if the correct AJV version is installed
  const packageLockPath = path.join(__dirname, 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
    const ajvVersion = packageLock.dependencies?.ajv?.version || 'not found';
    console.log('AJV version in package-lock.json:', ajvVersion);
  }
  
  // Check node_modules
  const ajvPackagePath = path.join(__dirname, 'node_modules', 'ajv', 'package.json');
  if (fs.existsSync(ajvPackagePath)) {
    const ajvPackage = JSON.parse(fs.readFileSync(ajvPackagePath, 'utf8'));
    console.log('AJV version in node_modules:', ajvPackage.version);
  }
  
  console.log('AJV compatibility check completed');
} catch (error) {
  console.error('AJV check error:', error.message);
  // Don't exit with error - this is just a diagnostic script
} 