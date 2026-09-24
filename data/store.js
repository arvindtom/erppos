const fs = require('fs');
const path = require('path');
const initialData = require('./initialData');

const DB_FILE = path.join(__dirname, 'db.json');

let memoryDb = null;

function readDb() {
  if (memoryDb) return memoryDb;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      if (data.trim()) {
        memoryDb = JSON.parse(data);
        return memoryDb;
      }
    }
  } catch (err) {
    console.warn('Filesystem read failed, using initialData:', err.message);
  }
  memoryDb = JSON.parse(JSON.stringify(initialData));
  return memoryDb;
}

function writeDb(data) {
  memoryDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // In serverless environments like Vercel, filesystem is read-only
    console.warn('Filesystem write skipped (read-only environment):', err.message);
  }
}

// Initialize on boot
readDb();

const store = {
  getDb: () => readDb(),

  // Technicians
  getTechnicians: () => {
    const db = readDb();
    return db.technicians;
  },

  // Service Calls
  getServiceCalls: () => {
    const db = readDb();
    return db.serviceCalls;
  },

  getServiceCallById: (id) => {
    const db = readDb();
    return db.serviceCalls.find(c => c.id === id);
  },

  addServiceCall: (callData) => {
    const db = readDb();
    const count = db.serviceCalls.length + 1;
    const newId = `SC-${String(count).padStart(5, '0')}`;
    const newCall = {
      id: newId,
      customer: callData.customer || 'Unknown Customer',
      contact: callData.contact || '',
      device: callData.device || 'General Equipment',
      issue: callData.issue || 'Service Inspection',
      priority: callData.priority || 'Medium',
      status: callData.status || 'Open',
      technicianId: callData.technicianId || null,
      technicianName: callData.technicianName || null,
      date: callData.date || new Date().toISOString().split('T')[0],
      store: callData.store || 'ARC1'
    };
    db.serviceCalls.unshift(newCall);
    writeDb(db);
    return newCall;
  },

  assignTechnician: (callId, technicianId) => {
    const db = readDb();
    const call = db.serviceCalls.find(c => c.id === callId);
    const tech = db.technicians.find(t => t.id === technicianId);
    if (!call || !tech) {
      throw new Error('Call or Technician not found');
    }

    // If already assigned to someone else, adjust counts
    if (call.technicianId && call.technicianId !== technicianId) {
      const oldTech = db.technicians.find(t => t.id === call.technicianId);
      if (oldTech && oldTech.assignedToday > 0) {
        oldTech.assignedToday -= 1;
      }
    }

    call.technicianId = tech.id;
    call.technicianName = tech.name;
    call.status = 'Assigned';
    tech.assignedToday = (tech.assignedToday || 0) + 1;

    writeDb(db);
    return { call, tech };
  },

  unassignTechnician: (callId) => {
    const db = readDb();
    const call = db.serviceCalls.find(c => c.id === callId);
    if (!call) throw new Error('Call not found');

    if (call.technicianId) {
      const tech = db.technicians.find(t => t.id === call.technicianId);
      if (tech && tech.assignedToday > 0) {
        tech.assignedToday -= 1;
      }
    }

    call.technicianId = null;
    call.technicianName = null;
    call.status = 'Open';

    writeDb(db);
    return call;
  },

  updateServiceCallStatus: (callId, newStatus) => {
    const db = readDb();
    const call = db.serviceCalls.find(c => c.id === callId);
    if (!call) throw new Error('Call not found');

    call.status = newStatus;
    if (newStatus === 'Closed' && call.technicianId) {
      const tech = db.technicians.find(t => t.id === call.technicianId);
      if (tech) {
        tech.closedToday = (tech.closedToday || 0) + 1;
      }
    }
    writeDb(db);
    return call;
  },

  // Stock Requests
  getStockRequests: (filters = {}) => {
    const db = readDb();
    let list = [...db.stockRequests];

    if (filters.fromStore && filters.fromStore !== 'All Stores') {
      list = list.filter(r => r.fromStore.toLowerCase().includes(filters.fromStore.toLowerCase()));
    }
    if (filters.toStore && filters.toStore !== 'All Stores') {
      list = list.filter(r => r.toStore.toLowerCase().includes(filters.toStore.toLowerCase()));
    }
    if (filters.type && filters.type !== 'All Types') {
      list = list.filter(r => r.type.toLowerCase().includes(filters.type.toLowerCase()));
    }
    if (filters.status && filters.status !== 'All Statuses') {
      list = list.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.approval && filters.approval !== 'All') {
      list = list.filter(r => r.approval.toLowerCase() === filters.approval.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r => 
        r.id.toLowerCase().includes(q) ||
        r.fromStore.toLowerCase().includes(q) ||
        r.toStore.toLowerCase().includes(q) ||
        (r.items && r.items.some(i => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)))
      );
    }

    return list;
  },

  addStockRequest: (reqData) => {
    const db = readDb();
    const count = db.stockRequests.length + 891;
    const year = new Date().getFullYear();
    const newId = `REQ-${year}-${String(count).padStart(4, '0')}`;
    const newReq = {
      id: newId,
      date: reqData.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      fromStore: reqData.fromStore || 'North Hub (WH-01)',
      toStore: reqData.toStore || 'East Central (ST-04)',
      type: reqData.type || 'Transfer',
      itemsCount: reqData.items ? reqData.items.length : (reqData.itemsCount || 1),
      approval: 'Waiting',
      status: 'Pending',
      notes: reqData.notes || '',
      items: reqData.items || [
        { code: '500288', name: reqData.sampleItem || 'Item Transfer Order', qty: reqData.sampleQty || 10 }
      ]
    };
    db.stockRequests.unshift(newReq);
    writeDb(db);
    return newReq;
  },

  updateStockRequestApproval: (id, approval, status) => {
    const db = readDb();
    const req = db.stockRequests.find(r => r.id === id);
    if (!req) throw new Error('Stock request not found');
    if (approval) req.approval = approval;
    if (status) req.status = status;
    writeDb(db);
    return req;
  },

  // Sales Returns
  getSalesReturns: (filters = {}) => {
    const db = readDb();
    let list = [...db.salesReturns];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r =>
        r.returnNo.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerCode.toLowerCase().includes(q) ||
        r.mobile.toLowerCase().includes(q)
      );
    }
    if (filters.store && filters.store !== 'All Stores') {
      list = list.filter(r => r.store.toLowerCase().includes(filters.store.toLowerCase()));
    }
    if (filters.status && filters.status !== 'All Status') {
      list = list.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }

    return list;
  },

  addSalesReturn: (returnData) => {
    const db = readDb();
    const count = 260043 + db.salesReturns.length - 10;
    const returnNo = String(count);
    const gross = parseFloat(returnData.grossTotal) || 10000;
    const tax = Math.round(gross * 0.12 * 100) / 100;
    const docTotal = gross + tax;

    const newReturn = {
      returnNo: returnNo,
      date: returnData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerCode: returnData.customerCode || 'C' + (returnData.mobile || '9999999999'),
      customerName: returnData.customerName || 'Customer',
      mobile: returnData.mobile || '-',
      store: returnData.store || 'ARC1',
      grossTotal: gross,
      taxAmount: tax,
      docTotal: docTotal,
      status: 'OPEN',
      createdOn: returnData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      reason: returnData.reason || 'Customer Return',
      item: returnData.item || 'General Goods'
    };

    db.salesReturns.unshift(newReturn);
    writeDb(db);
    return newReturn;
  },

  // Check Item Price & Stock
  getItems: (filters = {}) => {
    const db = readDb();
    let list = [...db.items];

    if (filters.store && filters.store !== 'All Stores') {
      const s = filters.store.split('—')[0].trim().toLowerCase();
      list = list.filter(i => !i.store || i.store.toLowerCase().includes(s) || s.includes(i.store.toLowerCase()));
    }
    if (filters.brand && filters.brand !== 'All Brands') {
      list = list.filter(i => i.brand.toLowerCase() === filters.brand.toLowerCase());
    }
    if (filters.category && filters.category !== 'All Categories') {
      list = list.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(i =>
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }

    return list;
  },

  // Customers
  getCustomers: (filters = {}) => {
    const db = readDb();
    let list = [...db.customers];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.gst && c.gst.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    }
    if (filters.status && filters.status !== 'All Status') {
      list = list.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
    }

    return list;
  },

  addCustomer: (custData) => {
    const db = readDb();
    const initials = custData.name ? custData.name.trim().substring(0, 2).toUpperCase() : 'CU';
    const newCust = {
      id: 'cust-' + (db.customers.length + 1),
      code: custData.code || ('C' + (custData.phone || Date.now().toString().slice(-6))),
      name: custData.name,
      phone: custData.phone || '-',
      email: custData.email || '—',
      gst: custData.gst || '—',
      city: custData.city || 'TIRUPUR',
      state: custData.state || 'TN',
      status: custData.status || 'Active',
      initial: initials,
      avatarBg: 'bg-secondary'
    };
    db.customers.unshift(newCust);
    writeDb(db);
    return newCust;
  },

  updateCustomer: (id, updates) => {
    const db = readDb();
    const cust = db.customers.find(c => c.id === id || c.code === id);
    if (!cust) throw new Error('Customer not found');
    Object.assign(cust, updates);
    writeDb(db);
    return cust;
  },

  deleteCustomer: (id) => {
    const db = readDb();
    const index = db.customers.findIndex(c => c.id === id || c.code === id);
    if (index === -1) throw new Error('Customer not found');
    const removed = db.customers.splice(index, 1)[0];
    writeDb(db);
    return removed;
  },

  // Payment Receipts
  getReceipts: (filters = {}) => {
    const db = readDb();
    let list = [...db.receipts];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r =>
        r.docNo.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        r.mobile.toLowerCase().includes(q)
      );
    }
    if (filters.store && filters.store !== 'All Stores') {
      const s = filters.store.split('-')[0].trim().toLowerCase();
      list = list.filter(r => r.store.toLowerCase().includes(s));
    }
    if (filters.status && filters.status !== 'all' && filters.status !== 'All Status') {
      list = list.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }

    return list;
  },

  addReceipt: (receiptData) => {
    const db = readDb();
    const count = 240263 + db.receipts.length - 10;
    const docNo = String(count);
    const newReceipt = {
      docNo: docNo,
      date: receiptData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customer: receiptData.customer || 'Customer',
      mobile: receiptData.mobile || '-',
      store: receiptData.store || 'ARC1',
      amountPaid: parseFloat(receiptData.amountPaid) || 0,
      transType: receiptData.transType || 'Against Transaction',
      status: receiptData.status || 'OPEN',
      paymentMethod: receiptData.paymentMethod || 'Cash',
      refNo: receiptData.refNo || `TXN-${Math.floor(100000 + Math.random() * 900000)}`
    };
    db.receipts.unshift(newReceipt);
    writeDb(db);
    return newReceipt;
  },

  // Global search across modules
  searchAll: (query) => {
    if (!query || query.length < 2) return { results: [] };
    const db = readDb();
    const q = query.toLowerCase();
    const results = [];

    // Search customers
    db.customers.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.phone.includes(q)) {
        results.push({
          type: 'Customer',
          title: c.name,
          subtitle: `Code: ${c.code} • ${c.phone}`,
          url: '/customers'
        });
      }
    });

    // Search service calls
    db.serviceCalls.forEach(s => {
      if (s.id.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q) || s.device.toLowerCase().includes(q)) {
        results.push({
          type: 'Service Call',
          title: `${s.id} - ${s.customer}`,
          subtitle: `${s.device} (${s.status})`,
          url: '/technician-assignment'
        });
      }
    });

    // Search Stock Requests
    db.stockRequests.forEach(r => {
      if (r.id.toLowerCase().includes(q) || r.fromStore.toLowerCase().includes(q) || r.toStore.toLowerCase().includes(q)) {
        results.push({
          type: 'Stock Request',
          title: r.id,
          subtitle: `${r.fromStore} → ${r.toStore} (${r.status})`,
          url: '/stock-requests'
        });
      }
    });

    // Search Items
    db.items.forEach(i => {
      if (i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q)) {
        results.push({
          type: 'Item',
          title: i.name,
          subtitle: `Code: ${i.code} • ₹${i.price.toLocaleString('en-IN')}`,
          url: '/check-item-price-and-stock'
        });
      }
    });

    // Search Receipts
    db.receipts.forEach(rc => {
      if (rc.docNo.toLowerCase().includes(q) || rc.customer.toLowerCase().includes(q)) {
        results.push({
          type: 'Receipt',
          title: `Receipt #${rc.docNo}`,
          subtitle: `${rc.customer} • ₹${rc.amountPaid.toLocaleString('en-IN')}`,
          url: '/payment-receipts'
        });
      }
    });

    return { results: results.slice(0, 10) };
  }
};

module.exports = store;
