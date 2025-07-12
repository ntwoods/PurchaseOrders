export function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('requests-container').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'none';
}

export function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('requests-container').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

export function displayRequests(requests) {
  const container = document.getElementById('requests-container');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');

  loading.style.display = 'none';

  if (!requests || requests.length === 0) {
    emptyState.style.display = 'block';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'grid';
  container.innerHTML = ''; // Clear previous requests

  requests.forEach((request, index) => {
    // Attach full request object as data attribute or to global handler
    const card = createRequestCard(request, index);
    container.appendChild(card);
  });
}

function createRequestCard(request, index) {
  const card = document.createElement('div');
  card.className = 'request-card';
  
  // Store relevant data on the card for event delegation
  card.dataset.index = index; // Keep index for array lookup if needed
  card.dataset.timestamp = request.timestamp; // Crucial for Mark Done/Cancel
  card.dataset.requesterName = request.requesterName;
  card.dataset.googleSheetURL = request.googleSheetURL;

  const timestamp = new Date(request.timestamp);
  const formattedDate = timestamp.toLocaleDateString();
  const formattedTime = timestamp.toLocaleTimeString();

  card.innerHTML = `
    <div class="request-header">
      <div class="request-id">REQ #${index + 1}</div>
      <div class="request-time">${formattedDate}<br>${formattedTime}</div>
    </div>
    <div class="requester">${request.requesterName}</div>
    <div class="actions">
      <a href="${request.googleSheetURL}" target="_blank" class="btn btn-primary">📊 View Sheet</a>
      <button class="btn btn-success mark-done-btn" data-timestamp="${request.timestamp}" data-requester="${request.requesterName}" data-sheet-url="${request.googleSheetURL}">✅ Mark Done</button>
      <button class="btn btn-primary cancel-btn" style="background: linear-gradient(135deg, #f44336 0%, #e57373 100%);" data-timestamp="${request.timestamp}" data-requester="${request.requesterName}">❌ Cancel</button>
    </div>
  `;

  return card;
}


export function showToast(message, type = 'info') {
  // A more sophisticated toast notification could be implemented here
  // For now, using alert as per original implementation
  alert(message);
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}
