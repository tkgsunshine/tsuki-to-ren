import http from 'http';

const server = http.createServer((req, res) => {
  const target = `http://localhost:5173${req.url}`;
  res.writeHead(302, {
    Location: target,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(`Redirecting to ${target}`);
});

server.listen(5175, '0.0.0.0', () => {
  console.log('🔄 Port 5175 forwarder active: http://localhost:5175 -> http://localhost:5173');
});
