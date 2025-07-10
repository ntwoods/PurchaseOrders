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

  if (requests.length === 0) {
    emptyState.style.display = 'block';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'grid';
  container.innerHTML = '';

  requests.forEach((request, index) => {
    const card = createRequestCard(request, index);
    container.appendChild(card);
  });
}

function createRequestCard(request, index) {
  const card = document.createElement('div');
  card.className = 'request-card';

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
      <button class="btn btn-success">✅ Mark Done</button>
      <button class="btn btn-primary" style="background: linear-gradient(135deg, #f44336 0%, #e57373 100%);">❌ Cancel</button>
    </div>
  `;

  return card;
}
