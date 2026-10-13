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

// Inject static runtime flag into index.html so native app is 100% guaranteed to launch Customer mode
const destHtml = path.join(destPublicDir, 'index.html');
if (fs.existsSync(destHtml)) {
  let html = fs.readFileSync(destHtml, 'utf8');
  if (!html.includes('window.__RMS_APP_MODE__')) {
    html = html.replace('<head>', '<head><script>window.__RMS_APP_MODE__="customer";</script>');
    fs.writeFileSync(destHtml, html, 'utf8');
    console.log('Injected window.__RMS_APP_MODE__="customer" into android-customer index.html');
  }
}

console.log('✅ Successfully synced customer web assets to android-customer.');
