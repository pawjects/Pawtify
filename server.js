const app = require('./server/index');
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pawtify server running on port ${PORT}`);
  });
}

module.exports = app;
