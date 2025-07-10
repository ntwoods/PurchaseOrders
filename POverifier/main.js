// ✅ Import dependencies
import { loadRequests } from './modules/loadRequests.js';
import { bindSpecEditorNavigation } from './modules/specEditor.js';
import { confirmMarkDone } from './modules/markDone.js';
import { checkMissingSuppliers } from './modules/api.js';
import { openSpecEditorModal } from './modules/specEditor.js';
import { confirmMarkDone as createConfirmMarkDone } from './modules/markDone.js';


// Shared state
let currentCategoryIndex = 0;
const setCurrentCategoryIndex = (index) => {
  currentCategoryIndex = index;
};

// GAS endpoint
const API_URL2 = 'https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec';


// ✅ Declare state variables (shared across logic)
let categoriesWithSpecs = [];
let temporaryEditedSpecs = {};
let currentRequestDataForSpecs = null;

// ✅ DOM Ready logic
document.addEventListener('DOMContentLoaded', () => {
  // Load initial PO request cards
  loadRequests();

  // Set up spec editor navigation logic
  bindSpecEditorNavigation({
    categoriesWithSpecs,
    temporaryEditedSpecs,
    setCurrentCategoryIndex
  });

  // Wire up Save Specs & Confirm PO button
  document.getElementById('saveSpecsAndConfirmBtn')?.addEventListener('click', () => {
    const confirmMarkDone = createConfirmMarkDone({
      categoriesWithSpecs,
      currentCategoryIndex,
      currentRequestDataForSpecs,
      temporaryEditedSpecs,
      API_URL2
    });

    confirmMarkDone(); // run it
  });
});

// ✅ Event: Mark Done Button
window.handleMarkDone = async function (btn) {
  const index = parseInt(btn.dataset.index, 10);
  const cards = document.querySelectorAll('.request-card');
  const card = cards[index];

  if (!card) return;

  const requesterName = card.querySelector('.requester')?.textContent;
  const googleSheetURL = card.querySelector('a')?.href;

  // Store current request context
  currentRequestDataForSpecs = {
    requesterName,
    googleSheetURL
  };

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

    // Update categoriesWithSpecs for modal editor
    categoriesWithSpecs = filteredSpecsForEditor.map(c => ({ category: c.category }));

    if (missingOrders.length > 0) {
      modalContent.innerHTML = `
        <h3>⚠️ Missing Suppliers</h3>
        <p style="color: #e74c3c;">${missingOrders.length} orders are missing suppliers:</p>
        <ul style="text-align: left; padding-left: 20px; max-height: 150px; overflow-y: auto;">
          ${missingOrders.map(o => `<li>${o}</li>`).join('')}
        </ul>

        <hr style="margin: 20px 0;" />

        <h4 style="color: #4caf50;">✅ Orders Ready (Supplier Provided)</h4>
        <p style="color: #4caf50;">${completedOrders.length} orders will proceed to spec editor:</p>
        <ul style="text-align: left; padding-left: 20px; max-height: 150px; overflow-y: auto;">
          ${completedOrders.map(o => `<li>${o}</li>`).join('')}
        </ul>

        <p style="margin-top: 15px;">You can still proceed to edit specs only for completed orders.</p>

        <div class="modal-actions">
          <button class="btn btn-success" onclick="window.proceedSpecEditor()">Proceed Anyway</button>
          <button class="btn" onclick="document.getElementById('confirmModal').style.display = 'none'">Cancel</button>
        </div>
      `;

      // Store specs for later use in modal
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

// ✅ Proceed Anyway → open Spec Editor
window.proceedSpecEditor = function () {
  document.getElementById('confirmModal').style.display = 'none';
  if (window.__filteredSpecsForEditor) {
    openSpecEditorModal(window.__filteredSpecsForEditor);
  } else {
    alert("No specs available. Please refresh.");
  }
};
