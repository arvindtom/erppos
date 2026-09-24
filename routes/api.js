const express = require('express');
const router = express.Router();
const store = require('../data/store');

// Technicians
router.get('/technicians', (req, res) => {
  res.json(store.getTechnicians());
});

// Service Calls
router.get('/service-calls', (req, res) => {
  res.json(store.getServiceCalls());
});

router.post('/service-calls', (req, res) => {
  try {
    const newCall = store.addServiceCall(req.body);
    res.status(201).json({ success: true, data: newCall });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/service-calls/:id/assign', (req, res) => {
  try {
    const { technicianId } = req.body;
    if (!technicianId) {
      return res.status(400).json({ success: false, message: 'technicianId is required' });
    }
    const result = store.assignTechnician(req.params.id, technicianId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/service-calls/:id/unassign', (req, res) => {
  try {
    const call = store.unassignTechnician(req.params.id);
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/service-calls/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const call = store.updateServiceCallStatus(req.params.id, status);
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Stock Requests
router.get('/stock-requests', (req, res) => {
  const requests = store.getStockRequests(req.query);
  res.json(requests);
});

router.post('/stock-requests', (req, res) => {
  try {
    const newReq = store.addStockRequest(req.body);
    res.status(201).json({ success: true, data: newReq });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/stock-requests/:id/approval', (req, res) => {
  try {
    const { approval, status } = req.body;
    const updated = store.updateStockRequestApproval(req.params.id, approval, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Sales Returns
router.get('/sales-returns', (req, res) => {
  const list = store.getSalesReturns(req.query);
  res.json(list);
});

router.post('/sales-returns', (req, res) => {
  try {
    const newReturn = store.addSalesReturn(req.body);
    res.status(201).json({ success: true, data: newReturn });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/sales-returns/export', (req, res) => {
  const list = store.getSalesReturns(req.query);
  let csv = 'RETURN NO,DATE,CUSTOMER CODE,CUSTOMER NAME,MOBILE,STORE,GROSS TOTAL,TAX AMOUNT,DOC TOTAL,STATUS,CREATED ON\n';
  list.forEach(r => {
    csv += `"${r.returnNo}","${r.date}","${r.customerCode}","${r.customerName}","${r.mobile}","${r.store}","${r.grossTotal}","${r.taxAmount}","${r.docTotal}","${r.status}","${r.createdOn}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sales_returns.csv');
  res.send(csv);
});

// Check Item Price & Stock
router.get('/items', (req, res) => {
  const list = store.getItems(req.query);
  res.json(list);
});

router.get('/items/export', (req, res) => {
  const list = store.getItems(req.query);
  let csv = 'ITEM CODE,ITEM NAME,BRAND,CATEGORY,UOM,PRICELIST,PRICE,ON HAND,RESERVED,AVAILABLE,STATUS\n';
  list.forEach(i => {
    csv += `"${i.code}","${i.name}","${i.brand}","${i.category}","${i.uom}","${i.pricelist}","${i.price}","${i.onHand}","${i.reserved}","${i.available}","${i.status}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=stock_and_prices.csv');
  res.send(csv);
});

// Customers
router.get('/customers', (req, res) => {
  const list = store.getCustomers(req.query);
  res.json(list);
});

router.post('/customers', (req, res) => {
  try {
    const newCust = store.addCustomer(req.body);
    res.status(201).json({ success: true, data: newCust });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/customers/:id', (req, res) => {
  try {
    const updated = store.updateCustomer(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/customers/:id', (req, res) => {
  try {
    const removed = store.deleteCustomer(req.params.id);
    res.json({ success: true, data: removed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/customers/export', (req, res) => {
  const list = store.getCustomers(req.query);
  let csv = 'CUSTOMER CODE,NAME,PHONE,EMAIL,GST,LOCATION,STATUS\n';
  list.forEach(c => {
    csv += `"${c.code}","${c.name}","${c.phone}","${c.email}","${c.gst}","${c.city}, ${c.state}","${c.status}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
  res.send(csv);
});

// Receipts
router.get('/receipts', (req, res) => {
  const list = store.getReceipts(req.query);
  res.json(list);
});

router.post('/receipts', (req, res) => {
  try {
    const newReceipt = store.addReceipt(req.body);
    res.status(201).json({ success: true, data: newReceipt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/receipts/export', (req, res) => {
  const list = store.getReceipts(req.query);
  let csv = 'DOC NO,DATE,CUSTOMER,MOBILE,STORE,AMOUNT PAID,TRANS TYPE,STATUS,PAYMENT METHOD,REF NO\n';
  list.forEach(r => {
    csv += `"${r.docNo}","${r.date}","${r.customer}","${r.mobile}","${r.store}","${r.amountPaid}","${r.transType}","${r.status}","${r.paymentMethod}","${r.refNo}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=payment_receipts.csv');
  res.send(csv);
});

// Global Search
router.get('/search', (req, res) => {
  const results = store.searchAll(req.query.q);
  res.json(results);
});

module.exports = router;
