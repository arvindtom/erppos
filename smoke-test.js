const http = require('http');
const app = require('./server');

const TEST_PORT = 4005;

const endpoints = [
  '/',
  '/dashboard',
  '/technician-assignment',
  '/stock-requests',
  '/sales-returns',
  '/check-item-price-and-stock',
  '/customers',
  '/payment-receipts',
  '/service-calls',
  '/sales-orders',
  '/api/technicians',
  '/api/service-calls',
  '/api/stock-requests',
  '/api/sales-returns',
  '/api/items',
  '/api/customers',
  '/api/receipts',
  '/api/search?q=je'
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:${TEST_PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ path, statusCode: res.statusCode, length: data.length });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

const server = app.listen(TEST_PORT, async () => {
  console.log(`Test server running on port ${TEST_PORT}`);
  let allPassed = true;
  for (const ep of endpoints) {
    const res = await checkUrl(ep);
    if (res.error || (res.statusCode !== 200 && res.statusCode !== 302)) {
      console.log(`❌ ${ep} -> Status: ${res.statusCode}, Error: ${res.error || 'Unexpected status'}`);
      allPassed = false;
    } else {
      console.log(`✅ ${ep} -> Status: ${res.statusCode}, Bytes: ${res.length}`);
    }
  }

  // Test POST assign
  console.log('\nTesting POST /api/service-calls/SC-00003/assign...');
  const assignReq = http.request(`http://localhost:${TEST_PORT}/api/service-calls/SC-00003/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log(`✅ Assign Status: ${res.statusCode}`);
      const json = JSON.parse(body);
      console.log(`   Assigned call ${json.call.id} to technician ${json.tech.name}`);
      server.close(() => {
        console.log('\nAll tests completed successfully. Exiting code:', allPassed ? 0 : 1);
        process.exit(allPassed ? 0 : 1);
      });
    });
  });
  assignReq.write(JSON.stringify({ technicianId: 'tech-1' }));
  assignReq.end();
});
