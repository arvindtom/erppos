// Stock Requests Management

let activeRequests = [];

document.addEventListener('DOMContentLoaded', () => {
  // If URL has action=add, open modal
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    openNewRequestModal();
  }
});

function openNewRequestModal() {
  openModal('newRequestModal');
}

async function handleFilterSubmit(e) {
  if (e) e.preventDefault();
  const fromStore = document.getElementById('fromStoreFilter').value;
  const toStore = document.getElementById('toStoreFilter').value;
  const type = document.getElementById('transTypeFilter').value;
  const status = document.getElementById('transStatusFilter').value;
  const approval = document.getElementById('approvalFilter').value;
  const search = document.getElementById('itemCodeFilter').value.trim();

  const params = new URLSearchParams();
  if (fromStore && fromStore !== 'All Stores') params.append('fromStore', fromStore);
  if (toStore && toStore !== 'All Stores') params.append('toStore', toStore);
  if (type && type !== 'All Types') params.append('type', type);
  if (status && status !== 'All Statuses') params.append('status', status);
  if (approval && approval !== 'All') params.append('approval', approval);
  if (search) params.append('search', search);

  try {
    const res = await fetch(`/api/stock-requests?${params.toString()}`);
    const data = await res.json();
    renderStockTable(data);
  } catch (err) {
    showToast('Failed to fetch stock requests', 'error');
  }
}

function clearFilters() {
  document.getElementById('fromStoreFilter').value = 'All Stores';
  document.getElementById('toStoreFilter').value = 'All Stores';
  document.getElementById('transTypeFilter').value = 'All Types';
  document.getElementById('transStatusFilter').value = 'All Statuses';
  document.getElementById('approvalFilter').value = 'All';
  document.getElementById('itemCodeFilter').value = '';
  handleFilterSubmit();
}

function renderStockTable(list) {
  activeRequests = list;
  const tbody = document.getElementById('stockTableBody');
  const emptyState = document.getElementById('stockEmptyState');
  const badge = document.getElementById('activeReqBadge');
  const showing = document.getElementById('showingCount');
  const total = document.getElementById('totalCount');

  if (badge) badge.textContent = `${list.length} active`;
  if (showing) showing.textContent = `1-${list.length}`;
  if (total) total.textContent = list.length;

  if (!list || list.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  tbody.innerHTML = list.map(req => {
    let appBadge = 'bg-tertiary-fixed text-on-tertiary-fixed';
    if (req.approval === 'Approved') appBadge = 'bg-secondary-fixed text-on-secondary-fixed';
    if (req.approval === 'Rejected') appBadge = 'bg-error-container text-on-error-container';

    let statusBadge = 'bg-primary-fixed text-on-primary-fixed';
    if (req.status === 'In Transit') statusBadge = 'bg-secondary-container text-on-secondary-container';
    if (req.status === 'Completed') statusBadge = 'bg-emerald-100 text-emerald-800';

    return `
      <tr class="hover:bg-surface-container-low/50 transition-colors">
        <td class="py-space-md px-space-md font-medium text-secondary">
          <a href="javascript:void(0)" onclick="viewRequestDetails('${req.id}')" class="hover:underline">
            ${req.id}
          </a>
        </td>
        <td class="py-space-md px-space-md">${req.date}</td>
        <td class="py-space-md px-space-md">${req.fromStore}</td>
        <td class="py-space-md px-space-md">${req.toStore}</td>
        <td class="py-space-md px-space-md">${req.type}</td>
        <td class="py-space-md px-space-md">${req.itemsCount} items</td>
        <td class="py-space-md px-space-md">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-medium ${appBadge}">
            ${req.approval}
          </span>
        </td>
        <td class="py-space-md px-space-md">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-medium ${statusBadge}">
            ${req.status}
          </span>
        </td>
        <td class="py-space-md px-space-md text-right">
          <button onclick="viewRequestDetails('${req.id}')" class="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-on-surface transition-colors" title="View Details">
            <span class="material-symbols-outlined text-[18px]">visibility</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleNewStockRequestSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = {
    fromStore: formData.get('fromStore'),
    toStore: formData.get('toStore'),
    type: formData.get('type'),
    sampleItem: formData.get('sampleItem') || 'Stock Replenishment',
    notes: formData.get('notes')
  };

  try {
    const res = await fetch('/api/stock-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Request ${result.data.id} created!`, 'success');
      closeModal('newRequestModal');
      form.reset();
      refreshStockRequests();
    } else {
      showToast(result.message || 'Failed to create request', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

async function viewRequestDetails(id) {
  try {
    const res = await fetch('/api/stock-requests');
    const list = await res.json();
    const req = list.find(r => r.id === id);
    if (!req) return;

    document.getElementById('detailReqId').textContent = req.id;
    document.getElementById('detailReqSubtitle').textContent = `${req.type} • Status: ${req.status}`;
    document.getElementById('detailFromStore').textContent = req.fromStore;
    document.getElementById('detailToStore').textContent = req.toStore;
    document.getElementById('detailDate').textContent = req.date;
    document.getElementById('detailApprovalBadge').textContent = req.approval;

    const itemsContainer = document.getElementById('detailItemsList');
    if (req.items && req.items.length > 0) {
      itemsContainer.innerHTML = req.items.map(it => `
        <div class="flex items-center justify-between p-2 rounded bg-surface-container text-xs">
          <div>
            <span class="font-semibold text-on-surface">${it.name}</span>
            <span class="text-on-surface-variant block text-[11px]">Code: ${it.code}</span>
          </div>
          <span class="font-mono bg-surface-container-high px-2 py-0.5 rounded font-bold">${it.qty} Qty</span>
        </div>
      `).join('');
    } else {
      itemsContainer.innerHTML = `<div class="text-xs text-on-surface-variant p-2">${req.itemsCount} bulk items (Standard manifest)</div>`;
    }

    // Configure approve/reject buttons
    const btnApprove = document.getElementById('btnApprove');
    const btnReject = document.getElementById('btnReject');
    const btnDispatch = document.getElementById('btnDispatch');

    btnApprove.onclick = () => updateApproval(req.id, 'Approved', 'Pending');
    btnReject.onclick = () => updateApproval(req.id, 'Rejected', 'Cancelled');
    btnDispatch.onclick = () => updateApproval(req.id, 'Approved', 'In Transit');

    openModal('requestDetailsModal');
  } catch (err) {
    showToast('Failed to load details', 'error');
  }
}

async function updateApproval(id, approval, status) {
  try {
    const res = await fetch(`/api/stock-requests/${id}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval, status })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Request ${id} marked as ${approval} / ${status}`, 'success');
      closeModal('requestDetailsModal');
      refreshStockRequests();
    }
  } catch (err) {
    showToast('Update failed: ' + err.message, 'error');
  }
}

function refreshStockRequests() {
  handleFilterSubmit();
  showToast('Stock requests refreshed', 'info');
}
