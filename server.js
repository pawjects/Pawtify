// Ensure dependencies are installed before requiring express
try {
  require.resolve('express');
} catch (e) {
  console.log('Dependencies not found, auto-installing via npm...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install --prefer-offline --no-audit', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('Auto npm install error:', err);
  }
}

const app = require('./server/index');
const PORT = 3000;

if (require.main === module) {
  let retryCount = 0;
  function startServer() {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Pawtify server running on port ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        retryCount++;
        console.warn(`Port ${PORT} in use (attempt ${retryCount}). Waiting before retrying...`);
        setTimeout(() => {
          try {
            server.close();
          } catch (e) {}
          startServer();
        }, 1500);
      } else {
        console.error('Server error:', err);
      }
    });
  }
  startServer();
}

module.exports = app;
