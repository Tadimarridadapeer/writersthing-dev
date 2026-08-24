const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const urls = [
    'http://localhost:3000/stories/918c8ebb-a286-4059-8d60-ee700fbd2b71',
    'http://localhost:3000/blogs/fb751f5a-765a-4143-8885-350145110f3b',
    'http://localhost:3000/book/e385f5b8-4c4a-4c1d-94b5-de224e096441',
    'http://localhost:3000/authors/040f8437-bed3-400f-9d24-08489958f6f5'
  ];

  for (const url of urls) {
    console.log(`\nNavigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    const text = await page.evaluate(() => document.body.innerText);
    const isNotFound = text.includes('not found') || text.includes('Not Found');
    console.log(`- Text includes "not found": ${isNotFound}`);
    if (isNotFound) {
      console.log(`- Snippet: ${text.substring(0, 200)}...`);
    } else {
      console.log(`- Snippet: ${text.substring(0, 100).replace(/\n/g, ' ')}...`);
    }
  }

  await browser.close();
})();
