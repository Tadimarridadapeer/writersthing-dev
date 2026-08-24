const http = require('http');

function fetchTest(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const canonical = data.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
        const title = data.match(/<title>([^<]+)<\/title>/)?.[1];
        const notFound = data.includes('Story not found') || data.includes('Manuscript not found') || data.includes('not found');
        
        console.log(`Path: ${path}`);
        console.log(`- Canonical: ${canonical}`);
        console.log(`- Title: ${title}`);
        console.log(`- Not Found Text in HTML: ${notFound}`);
        console.log('---');
        resolve();
      });
    });
  });
}

async function run() {
  await fetchTest('/stories/918c8ebb-a286-4059-8d60-ee700fbd2b71');
  await fetchTest('/blogs/fb751f5a-765a-4143-8885-350145110f3b');
  await fetchTest('/book/e385f5b8-4c4a-4c1d-94b5-de224e096441');
  await fetchTest('/authors/040f8437-bed3-400f-9d24-08489958f6f5');
}

run();
