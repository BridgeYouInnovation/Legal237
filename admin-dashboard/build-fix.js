const { execSync } = require('child_process');

console.log('Installing compatible AJV versions...');

try {
  // Force install specific versions that are compatible
  execSync('npm install ajv@6.12.6 --save-dev', { stdio: 'inherit' });
  execSync('npm install ajv-keywords@3.5.2 --save-dev', { stdio: 'inherit' });
  execSync('npm install schema-utils@3.1.1 --save-dev', { stdio: 'inherit' });
  
  console.log('AJV compatibility fix completed successfully');
} catch (error) {
  console.error('Failed to apply AJV fix:', error.message);
  process.exit(1);
} 