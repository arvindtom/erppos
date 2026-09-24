// Customers Management Client JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    openAddCustomerModal();
  }
});

function openAddCustomerModal() {
  document.getElementById('customerForm').reset();
  document.getElementById('custFormId').value = '';
  document.getElementById('modalCustomerTitle').textContent = 'Add Customer';
  document.getElementById('modalCustomerIcon').textContent = 'person_add';
  openModal('customerFormModal');
}

async function openEditCustomerModal(id) {
  try {
    const res = await fetch('/api/customers');
    const list = await res.json();
    const cust = list.find(c => c.id === id || c.code === id);
    if (!cust) return;

    document.getElementById('custFormId').value = cust.id;
    document.getElementById('custFormCode').value = cust.code;
    document.getElementById('custFormName').value = cust.name;
    document.getElementById('custFormPhone').value = cust.phone;
    document.getElementById('custFormEmail').value = cust.email === '—' ? '' : cust.email;
    document.getElementById('custFormGst').value = cust.gst === '—' ? '' : cust.gst;
    document.getElementById('custFormCity').value = cust.city;
    document.getElementById('custFormState').value = cust.state;
    document.getElementById('custFormStatus').value = cust.status;

    document.getElementById('modalCustomerTitle').textContent = 'Edit Customer';
    document.getElementById('modalCustomerIcon').textContent = 'edit';
    openModal('customerFormModal');
  } catch (err) {
    showToast('Failed to load customer details', 'error');
  }
}

async function handleCustomerFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const id = formData.get('id');

  const payload = {
    code: formData.get('code'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email') || '—',
    gst: formData.get('gst') || '—',
    city: formData.get('city') || 'TIRUPUR',
    state: formData.get('state') || 'TN',
    status: formData.get('status')
  };

  try {
    const url = id ? `/api/customers/${id}` : '/api/customers';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      showToast(id ? 'Customer updated successfully!' : 'Customer created successfully!', 'success');
      closeModal('customerFormModal');
      setTimeout(() => window.location.reload(), 400);
    } else {
      showToast(result.message || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

async function confirmDeleteCustomer(id, name) {
  if (confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast(`Customer ${name} deleted`, 'info');
        const row = document.getElementById(`cust-row-${id}`);
        if (row) row.remove();
        setTimeout(() => window.location.reload(), 500);
      } else {
        showToast(result.message || 'Failed to delete customer', 'error');
      }
    } catch (err) {
      showToast('Error deleting customer: ' + err.message, 'error');
    }
  }
}

function filterCustomers() {
  const query = document.getElementById('customerSearchInput').value.toLowerCase();
  const status = document.getElementById('customerStatusFilter').value;

  const rows = document.querySelectorAll('#customersTableBody tr');

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const statusCell = row.cells[4].innerText.trim();

    const matchesQuery = !query || text.includes(query);
    const matchesStatus = status === 'All Status' || statusCell.includes(status);

    if (matchesQuery && matchesStatus) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function exportCustomersCSV() {
  window.location.href = '/api/customers/export';
  showToast('Downloading Customers CSV...', 'info');
}

function refreshCustomers() {
  showToast('Refreshing customers list...', 'info');
  window.location.reload();
}
