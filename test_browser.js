const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.exposeFunction('logError', (msg, url, line, col) => {
    console.log(`PAGE ERR DETAILED: ${msg} at ${url}:${line}:${col}`);
  });

  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', (event) => {
      window.logError(event.message, event.filename, event.lineno, event.colno);
    });
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('LOG ERR:', msg.text());
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await browser.close();
  console.log('DONE');
})();
