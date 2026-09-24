// Check Item Price & Stock Client JavaScript

let sortDirections = {};

function filterItems() {
  const storeVal = document.getElementById('itemStoreFilter').value.toLowerCase();
  const brandVal = document.getElementById('itemBrandFilter').value.toLowerCase();
  const catVal = document.getElementById('itemCategoryFilter').value.toLowerCase();
  const searchVal = document.getElementById('itemSearchInput').value.toLowerCase();

  const rows = document.querySelectorAll('#itemsTableBody tr');
  let matchCount = 0;

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const brand = row.cells[2].innerText.toLowerCase();
    const cat = row.cells[3].innerText.toLowerCase();

    const matchesSearch = !searchVal || text.includes(searchVal);
    const matchesBrand = brandVal === 'all brands' || brand.includes(brandVal);
    const matchesCat = catVal === 'all categories' || cat.includes(catVal);

    if (matchesSearch && matchesBrand && matchesCat) {
      row.style.display = '';
      matchCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const badge = document.getElementById('itemsBadgeCount');
  if (badge) badge.textContent = matchCount;
}

function clearItemFilters() {
  document.getElementById('itemStoreFilter').value = 'All Stores';
  document.getElementById('itemBrandFilter').value = 'All Brands';
  document.getElementById('itemCategoryFilter').value = 'All Categories';
  document.getElementById('itemSearchInput').value = '';
  filterItems();
}

function sortTable(colIndex, isNumeric = false) {
  const table = document.getElementById('itemsTable');
  const tbody = document.getElementById('itemsTableBody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  const dir = sortDirections[colIndex] === 'asc' ? 'desc' : 'asc';
  sortDirections[colIndex] = dir;

  rows.sort((a, b) => {
    let aVal = a.cells[colIndex].innerText.replace(/[^0-9.-]+/g, '');
    let bVal = b.cells[colIndex].innerText.replace(/[^0-9.-]+/g, '');

    if (isNumeric) {
      const aNum = parseFloat(aVal) || 0;
      const bNum = parseFloat(bVal) || 0;
      return dir === 'asc' ? aNum - bNum : bNum - aNum;
    } else {
      aVal = a.cells[colIndex].innerText.toLowerCase();
      bVal = b.cells[colIndex].innerText.toLowerCase();
      return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
  });

  rows.forEach(r => tbody.appendChild(r));
  showToast(`Sorted column ${dir.toUpperCase()}`, 'info');
}

function openColumnsModal() {
  openModal('columnsModal');
}

function exportItemsCSV() {
  window.location.href = '/api/items/export';
  showToast('Exporting Item Price & Stock CSV...', 'info');
}

function refreshItems() {
  showToast('Refreshing stock catalog...', 'info');
  window.location.reload();
}
