const http = require('http');

http.get('http://localhost:3001/api/reading-progress', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("reading-progress status:", res.statusCode);
    console.log(data);
  });
}).on('error', (err) => {
  console.error(err);
});

http.get('http://localhost:3001/api/bookmarks', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("bookmarks status:", res.statusCode);
    console.log(data);
  });
}).on('error', (err) => {
  console.error(err);
});
