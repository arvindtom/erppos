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
  },

  // Sales Orders
  getSalesOrders: (filters = {}) => {
    const db = readDb();
    let list = db.salesOrders || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(o => 
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.mobile.includes(q) ||
        o.customerCode.toLowerCase().includes(q)
      );
    }
    if (filters.status && filters.status !== 'All Status') {
      list = list.filter(o => o.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.store && filters.store !== 'All Stores') {
      list = list.filter(o => o.store.toLowerCase().includes(filters.store.toLowerCase()));
    }
    return list;
  },

  addSalesOrder: (orderData) => {
    const db = readDb();
    if (!db.salesOrders) db.salesOrders = [];
    const count = db.salesOrders.length + 46;
    const orderNo = `SO-2026-${String(count).padStart(4, '0')}`;
    const gross = parseFloat(orderData.grossTotal) || 0;
    const tax = Math.round(gross * 0.12 * 100) / 100;
    const docTotal = gross + tax;

    const newOrder = {
      orderNo,
      date: orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerCode: orderData.customerCode || 'C' + (orderData.mobile || '9999999999'),
      customerName: orderData.customerName || 'Walk-in Customer',
      mobile: orderData.mobile || '-',
      store: orderData.store || 'ARC1',
      itemsCount: orderData.items ? orderData.items.length : 1,
      deliveryDate: orderData.deliveryDate || new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      grossTotal: gross,
      taxAmount: tax,
      docTotal: docTotal,
      status: orderData.status || 'Confirmed',
      paymentStatus: orderData.paymentStatus || 'Paid',
      items: orderData.items || [
        { code: 'GEN-01', name: orderData.itemName || 'POS Retail Item', qty: 1, price: gross }
      ]
    };

    db.salesOrders.unshift(newOrder);
    writeDb(db);
    return newOrder;
  },

  // Customer Equipment Cards
  getCustomerEquipmentCards: (filters = {}) => {
    const db = readDb();
    let list = db.customerEquipmentCards || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c => 
        c.customer.toLowerCase().includes(q) ||
        c.item.toLowerCase().includes(q) ||
        c.serial.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q)
      );
    }
    return list;
  },

  addCustomerEquipmentCard: (cardData) => {
    const db = readDb();
    if (!db.customerEquipmentCards) db.customerEquipmentCards = [];
    const count = db.customerEquipmentCards.length + 10005;
    const newCard = {
      customer: cardData.customer,
      item: cardData.item,
      serial: cardData.serial || `SN-EQ-${count}`,
      model: cardData.model || 'Standard',
      brand: cardData.brand || 'Generic',
      warrantyTo: cardData.warrantyTo || '2027-12-31',
      contract: cardData.contract || `CNT-${count}`,
      status: cardData.status || 'Active'
    };
    db.customerEquipmentCards.unshift(newCard);
    writeDb(db);
    return newCard;
  },

  // Finance Receipts
  getFinanceReceipts: (filters = {}) => {
    const db = readDb();
    let list = db.financeReceipts || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r => 
        r.receiptNo.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.financier.toLowerCase().includes(q) ||
        r.doNumber.toLowerCase().includes(q)
      );
    }
    if (filters.status && filters.status !== 'All Status' && filters.status !== 'all') {
      list = list.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    return list;
  },

  addFinanceReceipt: (recData) => {
    const db = readDb();
    if (!db.financeReceipts) db.financeReceipts = [];
    const count = db.financeReceipts.length + 4;
    const receiptNo = `FR-2024-${String(count).padStart(5, '0')}`;
    const loanAmt = parseFloat(recData.loanAmt) || 0;
    const charges = parseFloat(recData.charges) || 0;
    const total = loanAmt + charges;

    const newRec = {
      receiptNo,
      date: recData.date || new Date().toISOString().split('T')[0],
      customer: recData.customer,
      mobile: recData.mobile || '-',
      store: recData.store || 'STR001',
      financier: recData.financier || 'HDFC Bank',
      doNumber: recData.doNumber || `DO-${String(count).padStart(3, '0')}`,
      loanAmt,
      charges,
      total,
      sapNo: recData.sapNo || `SAP-FR-${String(count).padStart(3, '0')}`,
      sapStatus: recData.sapStatus || 'PENDING',
      status: recData.status || 'OPEN'
    };
    db.financeReceipts.unshift(newRec);
    writeDb(db);
    return newRec;
  },

  // Stock Inward
  getStockInward: (filters = {}) => {
    const db = readDb();
    let list = db.stockInward || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s => s.docNo.toLowerCase().includes(q) || s.supplier.toLowerCase().includes(q));
    }
    return list;
  },

  addStockInward: (inwardData) => {
    const db = readDb();
    if (!db.stockInward) db.stockInward = [];
    const count = db.stockInward.length + 121;
    const newInward = {
      docNo: `INW-2026-${String(count).padStart(4, '0')}`,
      date: inwardData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      supplier: inwardData.supplier || 'Electronics Supplier',
      store: inwardData.store || 'ARC1',
      itemsCount: inwardData.itemsCount || 10,
      docTotal: parseFloat(inwardData.docTotal) || 50000,
      receivedBy: inwardData.receivedBy || 'Admin',
      status: 'Received'
    };
    db.stockInward.unshift(newInward);
    writeDb(db);
    return newInward;
  },

  // Point of Sale Checkout (POS Sale)
  recordPOSSale: (posData) => {
    const db = readDb();
    const subtotal = parseFloat(posData.subtotal) || 0;
    const tax = parseFloat(posData.tax) || Math.round(subtotal * 0.12 * 100) / 100;
    const discount = parseFloat(posData.discount) || 0;
    const total = subtotal + tax - discount;

    // 1. Create Sales Order
    const count = (db.salesOrders ? db.salesOrders.length : 0) + 46;
    const orderNo = `SO-2026-${String(count).padStart(4, '0')}`;
    const order = {
      orderNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerCode: posData.customerCode || 'POS-WALKIN',
      customerName: posData.customerName || 'Walk-in Retail Customer',
      mobile: posData.mobile || '-',
      store: posData.store || 'ARC1',
      itemsCount: posData.items ? posData.items.length : 1,
      deliveryDate: 'Immediate (POS Over Counter)',
      grossTotal: subtotal,
      taxAmount: tax,
      docTotal: total,
      status: 'Delivered',
      paymentStatus: 'Paid',
      items: posData.items || []
    };
    if (!db.salesOrders) db.salesOrders = [];
    db.salesOrders.unshift(order);

    // 2. Create Payment Receipt
    const rcCount = db.receipts.length + 240264;
    const receipt = {
      docNo: String(rcCount),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customer: posData.customerName || 'Walk-in Retail Customer',
      mobile: posData.mobile || '-',
      store: posData.store || 'ARC1',
      amountPaid: total,
      transType: 'Against Transaction',
      status: 'OPEN',
      paymentMethod: posData.paymentMethod || 'Cash',
      refNo: `POS-${Math.floor(100000 + Math.random() * 900000)}`
    };
    db.receipts.unshift(receipt);

    // 3. Deduct stock if item codes match
    if (posData.items && Array.isArray(posData.items)) {
      posData.items.forEach(cartItem => {
        const item = db.items.find(i => i.code === cartItem.code);
        if (item && item.onHand > 0) {
          item.onHand = Math.max(0, item.onHand - (cartItem.qty || 1));
          item.available = Math.max(0, item.onHand - item.reserved);
        }
      });
    }

    writeDb(db);
    return { order, receipt };
  }
};

module.exports = store;
