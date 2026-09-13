const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  let errors = [];
  page.on('pageerror', err => {
    errors.push('PAGE ERROR: ' + err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404')) errors.push('CONSOLE ERROR: ' + msg.text());
  });
  
  await page.goto('http://localhost:3000/#/search', { waitUntil: 'networkidle0' });
  
  // Click category card
  await page.evaluate(() => { document.querySelector('.category-card').click() });
  await new Promise(r => setTimeout(r, 2000));
  
  const searchInputVal = await page.evaluate(() => document.querySelector('.search-input').value);
  console.log('Search input value:', searchInputVal);
  
  const songsCount = await page.evaluate(() => document.querySelectorAll('.song-row').length);
  console.log('Songs found:', songsCount);
  
  if (errors.length > 0) {
    console.log(errors.join('\n'));
    process.exit(1);
  } else {
    console.log('No errors on nav.');
  }
  
  await browser.close();
})();
