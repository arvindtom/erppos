// Technician Assignment Kanban & Drag-and-Drop Handler

let draggedCallId = null;

document.addEventListener('DOMContentLoaded', () => {
  initDragAndDrop();
});

function initDragAndDrop() {
  const draggables = document.querySelectorAll('.call-draggable-card');
  const dropzones = document.querySelectorAll('.tech-dropzone-card');

  // Open Calls (Draggables)
  draggables.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCallId = card.getAttribute('data-id');
      e.dataTransfer.setData('text/plain', draggedCallId);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging-card');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging-card');
      // Clean up dropzone styles
      dropzones.forEach(dz => {
        dz.classList.remove('drag-over-active');
        const hint = dz.querySelector('.drop-hint');
        if (hint) hint.classList.add('hidden');
      });
    });
  });

  // Technicians (Dropzones)
  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over-active');
      const hint = zone.querySelector('.drop-hint');
      if (hint) hint.classList.remove('hidden');
    });

    zone.addEventListener('dragleave', (e) => {
      // Check if leaving the card itself
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over-active');
        const hint = zone.querySelector('.drop-hint');
        if (hint) hint.classList.add('hidden');
      }
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over-active');
      const hint = zone.querySelector('.drop-hint');
      if (hint) hint.classList.add('hidden');

      const callId = e.dataTransfer.getData('text/plain') || draggedCallId;
      const techId = zone.getAttribute('data-tech-id');
      const techName = zone.getAttribute('data-tech-name');

      if (callId && techId) {
        await performAssign(callId, techId, techName);
      }
    });
  });
}

// Perform Assignment API Call
async function performAssign(callId, techId, techName) {
  closeModal('assignModal');
  try {
    const res = await fetch(`/api/service-calls/${callId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId: techId })
    });
    const result = await res.json();

    if (result.success) {
      showToast(`Assigned ${callId} to ${result.tech.name}!`, 'success');

      // Update technician count in DOM
      const countEl = document.getElementById(`count-assigned-${techId}`);
      if (countEl) {
        countEl.textContent = result.tech.assignedToday;
      }

      // Remove card from Open Calls
      const callCard = document.getElementById(`call-${callId}`);
      if (callCard) {
        callCard.remove();
      }

      // Update Open Calls Count Badge
      const openBadge = document.getElementById('openCallsCountBadge');
      if (openBadge) {
        const cur = parseInt(openBadge.textContent.trim()) || 1;
        openBadge.textContent = Math.max(0, cur - 1);
        if (cur - 1 === 0) {
          const list = document.getElementById('openCallsList');
          if (list && !document.getElementById('noOpenCallsPlaceholder')) {
            list.innerHTML = `
              <div id="noOpenCallsPlaceholder" class="flex flex-col items-center justify-center h-48 text-on-surface-variant text-center p-4">
                <span class="material-symbols-outlined text-4xl mb-2 opacity-50">task_alt</span>
                <p class="text-sm font-medium">No Open Calls</p>
                <p class="text-xs opacity-75 mt-1">All service calls have been assigned!</p>
              </div>
            `;
          }
        }
      }

      // Append to Assigned Calls List
      const assignedList = document.getElementById('assignedCallsList');
      if (assignedList) {
        const assignedCard = document.createElement('div');
        assignedCard.id = `assigned-${callId}`;
        assignedCard.className = 'bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm relative group hover:shadow-md transition-all toast-animate';
        assignedCard.innerHTML = `
          <div class="absolute top-3 right-3 flex items-center gap-1.5">
            <span class="bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded text-label-sm font-label-md">
              Assigned
            </span>
          </div>
          <div class="pr-24">
            <span class="font-headline-sm text-secondary">${result.call.id}</span>
            <h3 class="font-body-lg font-medium text-on-surface mt-0.5">${result.call.customer}</h3>
            <p class="text-xs text-on-surface-variant">${result.call.device}</p>
          </div>
          <div class="text-body-sm text-on-surface-variant flex items-center justify-between pt-1 border-t border-surface-container">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-[14px] text-secondary">arrow_forward</span>
              <span class="font-medium text-on-surface">${result.tech.name}</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="updateCallStatus('${result.call.id}', 'In Progress')" class="text-xs px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed hover:opacity-90">Start</button>
              <button onclick="unassignCall('${result.call.id}')" class="text-xs px-1.5 py-0.5 rounded text-error hover:bg-error-container">
                <span class="material-symbols-outlined text-[14px]">undo</span>
              </button>
            </div>
          </div>
        `;
        assignedList.prepend(assignedCard);
      }

      // Update Assigned Calls Count Badge
      const assignedBadge = document.getElementById('assignedCallsCountBadge');
      if (assignedBadge) {
        const cur = parseInt(assignedBadge.textContent.trim()) || 0;
        assignedBadge.textContent = cur + 1;
      }

    } else {
      showToast(result.message || 'Failed to assign call', 'error');
    }
  } catch (err) {
    showToast('Assignment error: ' + err.message, 'error');
  }
}

// Unassign Call
async function unassignCall(callId) {
  try {
    const res = await fetch(`/api/service-calls/${callId}/unassign`, {
      method: 'POST'
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Call ${callId} returned to Open queue`, 'info');
      setTimeout(() => window.location.reload(), 400);
    } else {
      showToast(result.message || 'Failed to unassign', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

// Update Call Status
async function updateCallStatus(callId, status) {
  try {
    const res = await fetch(`/api/service-calls/${callId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Status updated to ${status}`, 'success');
      setTimeout(() => window.location.reload(), 400);
    }
  } catch (err) {
    showToast('Error updating status: ' + err.message, 'error');
  }
}

// Click to Assign Modal Trigger
function openAssignModal(callId) {
  document.getElementById('modalCallId').value = callId;
  document.getElementById('modalCallDisplay').textContent = callId;
  openModal('assignModal');
}

function reloadBoard() {
  showToast('Board refreshed', 'info');
  window.location.reload();
}
