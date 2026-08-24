const fs = require('fs'); 
const html = fs.readFileSync('.next/server/app/index.html', 'utf8'); 
console.log('Title:', html.match(/<title[^>]*>(.*?)<\/title>/)?.[1]); 
console.log('Canonical:', html.match(/<link[^>]*rel="canonical"[^>]*href="(.*?)"/)?.[1]); 
console.log('Description:', html.match(/<meta[^>]*name="description"[^>]*content="(.*?)"/)?.[1]); 
const ld = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/)?.[1]; 
console.log('JSON-LD:', ld);
