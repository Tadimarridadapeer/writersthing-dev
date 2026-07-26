const { spawn } = require('child_process');
const http = require('http');

const next = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

let logs = '';
next.stdout.on('data', (d) => { logs += d.toString(); console.log(d.toString()); });
next.stderr.on('data', (d) => { logs += d.toString(); console.error(d.toString()); });

// Wait a bit for server to start, then make request
setTimeout(() => {
  console.log("Making request to marketplace...");
  http.get('http://localhost:3000/marketplace', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log("Response status:", res.statusCode);
      // Wait a moment for errors to flush to stderr
      setTimeout(() => {
        next.kill();
        process.exit(0);
      }, 2000);
    });
  }).on('error', (err) => {
    console.error("Request failed:", err);
    next.kill();
    process.exit(1);
  });
}, 8000);
