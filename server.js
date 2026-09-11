const express = require('express');
const path = require('path');
const searchRoute = require('./api/search');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'docs')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Mount the modular search service
app.use('/api/search', searchRoute);

app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
