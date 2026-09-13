const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  let errors = [];
  page.on('pageerror', err => {
    errors.push('PAGE ERROR: ' + err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE ERROR: ' + msg.text());
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  if (errors.length > 0) {
    console.log(errors.join('\n'));
    process.exit(1);
  } else {
    console.log('No errors on load.');
  }
  
  await browser.close();
})();
