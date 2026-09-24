// Sales Returns Client JavaScript

function openNewReturnModal() {
  openModal('newReturnModal');
}

function calculateReturnTotals() {
  const gross = parseFloat(document.getElementById('returnGrossInput').value) || 0;
  const tax = Math.round(gross * 0.12 * 100) / 100;
  const total = gross + tax;

  document.getElementById('previewTax').textContent = `₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('previewDocTotal').textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

async function handleNewReturnSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const payload = {
    customerName: formData.get('customerName'),
    mobile: formData.get('mobile'),
    store: formData.get('store'),
    grossTotal: formData.get('grossTotal'),
    item: formData.get('item'),
    reason: formData.get('reason')
  };

  try {
    const res = await fetch('/api/sales-returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Return #${result.data.returnNo} recorded successfully!`, 'success');
      closeModal('newReturnModal');
      form.reset();
      setTimeout(() => window.location.reload(), 500);
    } else {
      showToast(result.message || 'Failed to record return', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

function filterReturnsTable() {
  const query = document.getElementById('returnSearchInput').value.toLowerCase();
  const storeVal = document.getElementById('returnStoreFilter').value.toLowerCase();
  const statusVal = document.getElementById('returnStatusFilter').value.toUpperCase();

  const rows = document.querySelectorAll('#returnsTableBody tr');
  let visibleCount = 0;

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const storeCell = row.cells[5].innerText.toLowerCase();
    const statusCell = row.cells[9].innerText.trim().toUpperCase();

    const matchesQuery = !query || text.includes(query);
    const matchesStore = storeVal === 'all stores' || storeCell.includes(storeVal);
    const matchesStatus = statusVal === 'ALL STATUS' || statusCell.includes(statusVal);

    if (matchesQuery && matchesStore && matchesStatus) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const countLabel = document.getElementById('returnsShowingText');
  if (countLabel) {
    countLabel.textContent = `Showing ${visibleCount} filtered entries`;
  }
}

function exportReturnsCSV() {
  window.location.href = '/api/sales-returns/export';
  showToast('Downloading Sales Returns CSV...', 'info');
}

function refreshReturns() {
  showToast('Refreshing Returns data...', 'info');
  window.location.reload();
}

function viewReturnSlip(returnNo) {
  showToast(`Viewing Return #${returnNo}`, 'info');
}
