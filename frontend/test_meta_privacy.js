const fs = require('fs'); 
const html = fs.readFileSync('.next/server/app/privacy.html', 'utf8'); 
console.log('Privacy Title:', html.match(/<title[^>]*>(.*?)<\/title>/)?.[1]); 
console.log('Privacy Description:', html.match(/<meta[^>]*name="description"[^>]*content="(.*?)"/)?.[1]); 
const html2 = fs.readFileSync('.next/server/app/terms.html', 'utf8'); 
console.log('Terms Title:', html2.match(/<title[^>]*>(.*?)<\/title>/)?.[1]); 
console.log('Terms Description:', html2.match(/<meta[^>]*name="description"[^>]*content="(.*?)"/)?.[1]); 
