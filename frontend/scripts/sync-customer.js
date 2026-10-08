const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'build');
const destPublicDir = path.join(rootDir, 'android-customer', 'app', 'src', 'main', 'assets', 'public');
const customerConfigFile = path.join(rootDir, 'capacitor.customer.config.json');
const destConfigFile = path.join(rootDir, 'android-customer', 'app', 'src', 'main', 'assets', 'capacitor.config.json');

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

console.log('Copying build to android-customer assets...');
if (fs.existsSync(destPublicDir)) {
  fs.rmSync(destPublicDir, { recursive: true, force: true });
}
copyRecursive(srcDir, destPublicDir);

if (fs.existsSync(customerConfigFile)) {
  fs.copyFileSync(customerConfigFile, destConfigFile);
  console.log('Copied capacitor.customer.config.json to android-customer assets.');
}

console.log('✅ Successfully synced customer web assets to android-customer.');
