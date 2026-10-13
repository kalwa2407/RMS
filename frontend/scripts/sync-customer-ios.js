const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'build');
const destPublicDir = path.join(rootDir, 'ios', 'App', 'App', 'public');
const customerConfigFile = path.join(rootDir, 'capacitor.customer.config.json');
const destConfigFile = path.join(rootDir, 'ios', 'App', 'App', 'capacitor.config.json');

console.log('Building customer web app for iOS...');
process.env.REACT_APP_APP_MODE = 'customer';
execSync('npx craco build', { stdio: 'inherit', cwd: rootDir, env: process.env });

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying build to iOS App public assets...');
if (fs.existsSync(destPublicDir)) {
  fs.rmSync(destPublicDir, { recursive: true, force: true });
}
copyRecursive(srcDir, destPublicDir);

if (fs.existsSync(customerConfigFile)) {
  fs.copyFileSync(customerConfigFile, destConfigFile);
  console.log('Copied capacitor.customer.config.json to iOS App assets.');
}

// Inject static runtime flag into index.html so iOS native app is 100% guaranteed to launch Customer mode
const destHtml = path.join(destPublicDir, 'index.html');
if (fs.existsSync(destHtml)) {
  let html = fs.readFileSync(destHtml, 'utf8');
  if (!html.includes('window.__RMS_APP_MODE__')) {
    html = html.replace('<head>', '<head><script>window.__RMS_APP_MODE__="customer";</script>');
    fs.writeFileSync(destHtml, html, 'utf8');
    console.log('Injected window.__RMS_APP_MODE__="customer" into iOS index.html');
  }
}

// Run capacitor sync
console.log('Running Capacitor sync for iOS...');
execSync('npx cap sync ios', { stdio: 'inherit', cwd: rootDir });

console.log('✅ Successfully synced customer web assets to iOS App.');
