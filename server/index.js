const express = require('express');
const path = require('path');
const fs = require('fs');
const searchHandler = require('./api/search');

const app = express();
const PORT = 3000;

// Enable CORS for all incoming requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Explicit Service Worker route with zero-caching headers so client updates apply immediately
app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../client/sw.js'));
});

// Serve static assets from public/ and client/ directories
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../client')));

// Search API endpoint
app.all('/api/search', searchHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// SPA catch-all for any non-static route
app.use((req, res) => {
  const appIndex = path.join(__dirname, '../client', 'index.html');
  if (fs.existsSync(appIndex)) {
    return res.sendFile(appIndex);
  }
  return res.status(404).send('Not Found');
});

// Run server only when executed directly (node server/index.js)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
