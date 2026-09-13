const express = require('express');
const path = require('path');
const fs = require('fs');
const searchHandler = require('./api/search');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Serve static assets from both public/ and app/ directories

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

  return res.sendFile(appIndex);
});

// Run server only when executed directly (node server.js)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
