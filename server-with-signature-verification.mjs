import http from 'node:http';

// Create a local server to receive data from
const server = http.createServer();

// Listen to the request event
server.on('request', (request, res) => {

  // Ignore everything that is not a webhook request
  if (request.url !== '/event' || request.method !== 'POST') {
    res.writeHead(404);
    res.end();
    return;
  }

  // Download all POST data (assume it's json)
  let body = '';
  request.on('data', chunk => body += chunk.toString());

  request.on('end', () => {
    // Display webhook event
    console.log(JSON.parse(body));

    // Make a string out of stringified payload and the timestamp HTTP header
    const stringToDigest = body + '.' + request.headers['x-timestamp'];

    // Calculate the correct signature
    const correctSignature = crypto
      .createHmac('sha384', 'slavaukraini') // Note: this is default secret for test webhooks
      .update(stringToDigest)
      .digest('base64');

    // Check if the received signature equals to the correct one
    if (correctSignature == request.headers['x-signature']) {
      // Signal success so that webhook isn't delivered once again
      res.writeHead(200);
      res.end('OK');
      return;
    }

    // Signature validation failed.
    res.writeHead(401);
    res.end('FAIL');
  });
});

const port = 8888;

// listen
server.listen(port);

console.log(`Example webhook server with signature validation is listening on http://<YOUR_IP>:${port}/event`);
