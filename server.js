const express = require('express');
const path = require('path');
const cors = require('cors');
const store = require('./data/store');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

// Setup Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount REST API
app.use('/api', apiRoutes);

// Helper for passing common template variables
function getCommonData(currentPath, pageTitle) {
  const db = store.getDb();
  return {
    currentPath,
    pageTitle: pageTitle || 'Enterprise ERP',
    techniciansCount: db.technicians.length,
    openCallsCount: db.serviceCalls.filter(c => c.status === 'Open').length,
    customersCount: db.customers.length,
    stockRequestsCount: db.stockRequests.length,
    returnsCount: db.salesReturns.length,
    receiptsCount: db.receipts.length
  };
}

// Routes matching the mockups
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  const db = store.getDb();
  res.render('dashboard', {
    ...getCommonData('dashboard', 'Enterprise ERP & POS Dashboard'),
    db
  });
});

app.get('/pos', (req, res) => {
  const items = store.getItems();
  res.render('pos', {
    ...getCommonData('pos', 'Point of Sale (POS) Terminal'),
    items
  });
});

app.get('/sales-orders', (req, res) => {
  const salesOrders = store.getSalesOrders();
  res.render('sales-orders', {
    ...getCommonData('sales-orders', 'Sales Orders'),
    salesOrders
  });
});

app.get('/customer-equipment-cards', (req, res) => {
  const customerEquipmentCards = store.getCustomerEquipmentCards();
  res.render('customer-equipment-cards', {
    ...getCommonData('customer-equipment-cards', 'Customer Equipment Cards'),
    customerEquipmentCards
  });
});

app.get('/finance-receipts', (req, res) => {
  const financeReceipts = store.getFinanceReceipts();
  res.render('finance-receipts', {
    ...getCommonData('finance-receipts', 'Finance Receipts'),
    financeReceipts
  });
});

app.get('/technician-assignment', (req, res) => {
  const db = store.getDb();
  const openCalls = db.serviceCalls.filter(c => c.status === 'Open');
  const assignedCalls = db.serviceCalls.filter(c => c.status !== 'Open' && c.technicianName);
  const technicians = db.technicians;

  res.render('technician-assignment', {
    ...getCommonData('technician-assignment', 'Technician Assignment'),
    openCalls,
    assignedCalls,
    technicians
  });
});

app.get('/stock-requests', (req, res) => {
  const stockRequests = store.getStockRequests();
  res.render('stock-requests', {
    ...getCommonData('stock-requests', 'Stock Requests'),
    stockRequests
  });
});

app.get('/sales-returns', (req, res) => {
  const salesReturns = store.getSalesReturns();
  res.render('sales-returns', {
    ...getCommonData('sales-returns', 'Sales Returns'),
    salesReturns
  });
});

app.get('/check-item-price-and-stock', (req, res) => {
  const items = store.getItems();
  res.render('check-item-price-and-stock', {
    ...getCommonData('check-item-price-and-stock', 'Check Item Price & Stock'),
    items
  });
});

app.get('/customers', (req, res) => {
  const customers = store.getCustomers();
  const totalCount = customers.length;
  const activeCount = customers.filter(c => c.status === 'Active').length;
  const gstCount = customers.filter(c => c.gst && c.gst !== '—' && c.gst.length > 5).length;

  res.render('customers', {
    ...getCommonData('customers', 'Customers'),
    customers,
    totalCount,
    activeCount,
    gstCount
  });
});

app.get('/payment-receipts', (req, res) => {
  const receipts = store.getReceipts();
  res.render('payment-receipts', {
    ...getCommonData('payment-receipts', 'Payment Receipts'),
    receipts
  });
});

app.get('/service-calls', (req, res) => {
  const db = store.getDb();
  res.render('service-calls', {
    ...getCommonData('service-calls', 'Service Calls'),
    serviceCalls: db.serviceCalls,
    technicians: db.technicians
  });
});

// Generic fallbacks for other ERP navigation items in mockup
const moduleTitles = {
  'sales-orders': 'Sales Orders',
  'sales-invoices': 'Sales Invoices',
  'sales-invoice-reprint': 'Sales Invoice Reprint',
  'customer-equipment-cards': 'Customer Equipment Cards',
  'service-dashboard': 'Service Dashboard',
  'service-contracts': 'Service Contracts',
  'stock-inward': 'Stock Inward',
  'finance-receipts': 'Finance Receipts',
  'accounts': 'Chart of Accounts',
  'control-center': 'System Control Center',
  'reports': 'Management Reports'
};

app.get('/:module', (req, res, next) => {
  const mod = req.params.module;
  if (moduleTitles[mod]) {
    res.render('generic-module', {
      ...getCommonData(mod, moduleTitles[mod]),
      moduleKey: mod,
      moduleTitle: moduleTitles[mod]
    });
  } else {
    next();
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('generic-module', {
    ...getCommonData('not-found', 'Page Not Found'),
    moduleKey: 'not-found',
    moduleTitle: 'Page Under Construction or Not Found'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 ERPPOS Node.js Application running on:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://localhost:${PORT}/technician-assignment`);
    console.log(`   http://localhost:${PORT}/stock-requests`);
    console.log(`   http://localhost:${PORT}/sales-returns`);
    console.log(`   http://localhost:${PORT}/check-item-price-and-stock`);
    console.log(`   http://localhost:${PORT}/customers`);
    console.log(`   http://localhost:${PORT}/payment-receipts`);
    console.log(`=================================================\n`);
  });
}

module.exports = app;
