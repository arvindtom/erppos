// Global Common JavaScript for ERPPOS

// Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-error text-on-error' : (type === 'info' ? 'bg-primary text-on-primary' : 'bg-secondary text-on-secondary');
  const icon = type === 'error' ? 'error' : (type === 'info' ? 'info' : 'check_circle');

  toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl ${bgClass} text-sm font-medium toast-animate pointer-events-auto transition-all`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">${icon}</span>
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="p-0.5 hover:opacity-75"><span class="material-symbols-outlined text-[16px]">close</span></button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal Helpers
function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}

// Global Quick Create Triggers
document.addEventListener('DOMContentLoaded', () => {
  const quickBtn = document.getElementById('quickCreateBtn');
  if (quickBtn) {
    quickBtn.addEventListener('click', () => openModal('quickCreateModal'));
  }

  // Notifications Toggle
  const notifBtn = document.getElementById('notificationBtn');
  const notifMenu = document.getElementById('notificationMenu');
  if (notifBtn && notifMenu) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      if (!notifMenu.classList.contains('hidden')) {
        notifMenu.classList.add('hidden');
      }
    });
  }

  // Global Search Autocomplete
  const searchInput = document.getElementById('globalSearchInput');
  const searchResults = document.getElementById('globalSearchResults');

  if (searchInput && searchResults) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if (query.length < 2) {
        searchResults.classList.add('hidden');
        searchResults.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            searchResults.innerHTML = data.results.map(r => `
              <a href="${r.url}" class="block p-3 hover:bg-surface-container-low transition-colors">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-secondary uppercase">${r.type}</span>
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant">arrow_forward</span>
                </div>
                <div class="text-sm font-medium text-on-surface mt-0.5">${r.title}</div>
                <div class="text-xs text-on-surface-variant">${r.subtitle}</div>
              </a>
            `).join('');
            searchResults.classList.remove('hidden');
          } else {
            searchResults.innerHTML = `<div class="p-3 text-xs text-on-surface-variant text-center">No results found for "${query}"</div>`;
            searchResults.classList.remove('hidden');
          }
        } catch (err) {
          console.error('Search error:', err);
        }
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }
});

// Quick Create Modals
function openQuickServiceCall() {
  closeModal('quickCreateModal');
  openModal('quickServiceCallModal');
}

function openQuickCustomer() {
  closeModal('quickCreateModal');
  if (typeof openAddCustomerModal === 'function') {
    openAddCustomerModal();
  } else {
    window.location.href = '/customers?action=add';
  }
}

function openQuickStockReq() {
  closeModal('quickCreateModal');
  if (typeof openNewRequestModal === 'function') {
    openNewRequestModal();
  } else {
    window.location.href = '/stock-requests?action=add';
  }
}

function openQuickReceipt() {
  closeModal('quickCreateModal');
  if (typeof openNewReceiptModal === 'function') {
    openNewReceiptModal();
  } else {
    window.location.href = '/payment-receipts?action=add';
  }
}

// Handle Quick Service Call
async function handleQuickServiceCallSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = {
    customer: formData.get('customer'),
    contact: formData.get('contact'),
    device: formData.get('device'),
    priority: formData.get('priority'),
    issue: formData.get('issue')
  };

  try {
    const res = await fetch('/api/service-calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Service Call ${result.data.id} created successfully!`, 'success');
      closeModal('quickServiceCallModal');
      form.reset();
      // If currently on technician assignment board or service calls page, reload
      if (window.location.pathname.includes('technician') || window.location.pathname.includes('service')) {
        setTimeout(() => window.location.reload(), 600);
      }
    } else {
      showToast(result.message || 'Failed to create call', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}
