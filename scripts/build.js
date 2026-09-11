const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'app');
const assetsDir = path.join(rootDir, 'assets');
const publicDir = path.join(rootDir, 'public');

console.log('[Build] Preparing public directory for Vercel and production...');
copyDir(appDir, publicDir);

if (fs.existsSync(assetsDir)) {
  copyDir(assetsDir, path.join(publicDir, 'assets'));
}

console.log('[Build] Success! Public assets synced ready for Vercel deployment.');
