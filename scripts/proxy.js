const http = require('http');

const PORT = process.env.PORT || 4000;
const NEXT_PORT = 3000;
const API_PORT = 4001;

function proxy(req, res) {
  const isApi = req.url.startsWith('/api') || req.url.startsWith('/docs') || req.url.startsWith('/health');
  const targetPort = isApi ? API_PORT : NEXT_PORT;

  const options = {
    hostname: 'localhost',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end('Bad Gateway');
    }
  });

  req.pipe(proxyReq);
}

const server = http.createServer(proxy);
server.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`);
});
