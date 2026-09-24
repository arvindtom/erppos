const http = require('http');
const app = require('./server');

const TEST_PORT = 4006;

const endpoints = [
  '/',
  '/dashboard',
  '/pos',
  '/sales-orders',
  '/sales-invoices',
  '/sales-invoice-reprint',
  '/service-dashboard',
  '/service-calls',
  '/customer-equipment-cards',
  '/service-contracts',
  '/technician-assignment',
  '/stock-inward',
  '/stock-outward',
  '/stock-requests',
  '/activities',
  '/leads',
  '/enquiry',
  '/sales-returns',
  '/check-item-price-and-stock',
  '/customers',
  '/payment-receipts',
  '/finance-receipts',
  '/api/technicians',
  '/api/service-calls',
  '/api/sales-orders',
  '/api/sales-invoices',
  '/api/sales-invoice-reprint',
  '/api/service-contracts',
  '/api/stock-inward',
  '/api/stock-outward',
  '/api/leads',
  '/api/customer-equipment-cards',
  '/api/finance-receipts',
  '/api/stock-requests',
  '/api/sales-returns',
  '/api/items',
  '/api/customers',
  '/api/receipts',
  '/api/search?q=arc'
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

  server.close(() => {
    console.log(allPassed ? '\n🌟 ALL 39 ROUTES & APIS PASSED SMOKE TESTS!' : '\n⚠️ SOME TESTS FAILED');
    process.exit(allPassed ? 0 : 1);
  });
});
