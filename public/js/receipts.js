// Payment Receipts Client JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const storeFilter = document.getElementById('receiptStoreFilter');

  if (searchInput && statusFilter) {
    function filterTable() {
      const query = searchInput.value.toLowerCase();
      const statusVal = statusFilter.value.toLowerCase();
      const storeVal = storeFilter ? storeFilter.value.toLowerCase() : 'all';
      const rows = document.querySelectorAll('#receiptsTableBody tr');

      let visible = 0;
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const storeCell = row.cells[4] ? row.cells[4].innerText.toLowerCase() : '';
        const statusSpan = row.querySelector('td:last-child span') ? row.querySelector('td:last-child span').innerText.toLowerCase() : '';
        
        const matchesSearch = !query || text.includes(query);
        const matchesStatus = statusVal === 'all' || statusSpan === statusVal;
        const matchesStore = storeVal === 'all' || storeCell.includes(storeVal);

        if (matchesSearch && matchesStatus && matchesStore) {
          row.style.display = '';
          visible++;
        } else {
          row.style.display = 'none';
        }
      });

      const label = document.getElementById('receiptsCountLabel');
      if (label) label.textContent = `Showing 1 to ${visible} filtered entries`;
    }

    searchInput.addEventListener('input', filterTable);
    statusFilter.addEventListener('change', filterTable);
    if (storeFilter) storeFilter.addEventListener('change', filterTable);
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    openNewReceiptModal();
  }
});

function openNewReceiptModal() {
  openModal('newReceiptModal');
}

async function handleNewReceiptSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const payload = {
    customer: formData.get('customer'),
    mobile: formData.get('mobile'),
    amountPaid: formData.get('amountPaid'),
    paymentMethod: formData.get('paymentMethod'),
    transType: formData.get('transType'),
    store: formData.get('store'),
    refNo: formData.get('refNo')
  };

  try {
    const res = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Receipt #${result.data.docNo} generated!`, 'success');
      closeModal('newReceiptModal');
      form.reset();
      setTimeout(() => window.location.reload(), 500);
    } else {
      showToast(result.message || 'Failed to record receipt', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

async function viewReceiptSlip(docNo) {
  try {
    const res = await fetch('/api/receipts');
    const list = await res.json();
    const r = list.find(item => item.docNo === docNo);
    if (!r) return;

    const voucher = document.getElementById('voucherContent');
    voucher.innerHTML = `
      <div class="text-center pb-2 border-b border-surface-container">
        <h2 class="font-headline-md text-on-surface">Enterprise ERP - ARC1</h2>
        <p class="text-xs text-on-surface-variant">Tax Invoice / Official Payment Receipt</p>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs py-2 border-b border-surface-container">
        <div><span class="text-on-surface-variant">Doc No:</span> <strong class="text-secondary font-mono">${r.docNo}</strong></div>
        <div><span class="text-on-surface-variant">Date:</span> <span>${r.date}</span></div>
        <div><span class="text-on-surface-variant">Customer:</span> <strong class="text-on-surface">${r.customer}</strong></div>
        <div><span class="text-on-surface-variant">Mobile:</span> <span>${r.mobile}</span></div>
      </div>

      <div class="py-2 space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Transaction Type:</span>
          <span class="font-medium text-on-surface">${r.transType}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Payment Mode:</span>
          <span class="font-medium text-on-surface">${r.paymentMethod || 'Cash'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Reference No:</span>
          <span class="font-mono text-on-surface">${r.refNo || 'N/A'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Status:</span>
          <span class="font-semibold text-secondary">${r.status}</span>
        </div>
      </div>

      <div class="bg-surface-container-low p-3 rounded-xl flex items-center justify-between mt-2">
        <span class="font-semibold text-sm text-on-surface">Total Amount Paid:</span>
        <span class="font-headline-md font-mono text-secondary">₹${Number(r.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      <p class="text-[10px] text-center text-on-surface-variant mt-2">This is a system generated voucher. Thank you for your business!</p>
    `;

    openModal('receiptVoucherModal');
  } catch (err) {
    showToast('Failed to load voucher', 'error');
  }
}

function exportReceiptsCSV() {
  window.location.href = '/api/receipts/export';
  showToast('Downloading Payment Receipts CSV...', 'info');
}
