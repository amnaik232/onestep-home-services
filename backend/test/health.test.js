const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const http = require('node:http');

test('health endpoint returns ok', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  await new Promise(resolve => server.close(resolve));
});
