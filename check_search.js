const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  await page.goto('http://localhost:3000/#/search', { waitUntil: 'networkidle0' });
  
  await page.waitForSelector('.search-input');
  await page.type('.search-input', 'hello');
  
  // wait a bit for debouncer
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
