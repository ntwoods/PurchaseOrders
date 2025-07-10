import { loadRequests } from './modules/loadRequests.js';
import { bindSpecEditorNavigation } from './modules/specEditor.js';

document.addEventListener('DOMContentLoaded', () => {
  loadRequests();
  bindSpecEditorNavigation();
});

import { checkMissingSuppliers } from './modules/api.js';
import { openSpecEditorModal } from './modules/specEditor.js';

window.handleMarkDone = async function (btn) {
  const index = parseInt(btn.dataset.index, 10);
  const cards = document.querySelectorAll('.request-card');
  const card = cards[index];

  if (!card) return;

  const requesterName = card.querySelector('.requester')?.textContent;
  const googleSheetURL = card.querySelector('a')?.href;

  const modal = document.getElementById('confirmModal');
  const modalContent = modal.querySelector('.modal-content');

  modalContent.innerHTML = `
    <div class="loader" style="width: 40px; height: 40px; margin: 20px auto;"></div>
    <h3>Checking Supplier Information...</h3>
    <p>Please wait while we verify the purchase order details.</p>
  `;
  modal.style.display = 'block';

  try {
    const result = await checkMissingSuppliers(googleSheetURL);
    const { missingOrders, completedOrders, filteredSpecsForEditor } = result;

    if (missingOrders.length > 0) {
      modalContent.innerHTML = `
        <h3>⚠️ Missing Suppliers</h3>
        <p style="color: #e74c3c;">${missingOrders.length} orders are missing suppliers:</p>
        <ul style="text-align: left; padding-left: 20px;">
          ${missingOrders.map(o => `<li>${o}</li>`).join('')}
        </ul>
        <p>You can still proceed to edit specs only for completed orders.</p>
        <div class="modal-actions">
          <button class="btn btn-success" onclick="window.proceedSpecEditor()">Proceed Anyway</button>
          <button class="btn" onclick="document.getElementById('confirmModal').style.display = 'none'">Cancel</button>
        </div>
      `;

      // Save for later use
      window.__filteredSpecsForEditor = filteredSpecsForEditor;
    } else {
      modal.style.display = 'none';
      openSpecEditorModal(filteredSpecsForEditor);
    }
  } catch (err) {
    modal.style.display = 'none';
    alert("Failed to check suppliers. Please try again.");
  }
};


window.proceedSpecEditor = function () {
  document.getElementById('confirmModal').style.display = 'none';
  if (window.__filteredSpecsForEditor) {
    openSpecEditorModal(window.__filteredSpecsForEditor);
  } else {
    alert("No specs available. Please refresh.");
  }
};
