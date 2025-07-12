// ✅ Import dependencies
import { loadRequests, getRequestsData } from './modules/loadRequests.js';
import { openSpecEditorModal, displayCurrentCategorySpecs, saveCurrentSpec, navigateCategory, getCategoriesWithSpecs, getTemporaryEditedSpecs, getCurrentCategoryIndex } from './modules/specEditor.js';
import { confirmMarkDone } from './modules/markDone.js';
import { confirmMarkCancel } from './modules/markCancel.js'; // New import for cancel logic
import { checkMissingSuppliers, submitCustomOrder } from './modules/api.js';
import { showToast, closeModal, showError } from './modules/utils.js';
import { API_URL } from './modules/api.js'; // Consistent API_URL


// ✅ Shared state (managed in main.js, exposed via getters from modules if needed)
let currentRequestDataForSpecs = null; // Stores data for the PO currently being processed

// --- Event Handlers ---

// Function to handle "Mark Done" button click
async function handleMarkDone(event) {
    const btn = event.target;
    const timestamp = btn.dataset.timestamp;
    const requesterName = btn.dataset.requester;
    const googleSheetURL = btn.dataset.sheetUrl;

    // Store current request context
    currentRequestDataForSpecs = {
        timestamp,
        requesterName,
        googleSheetURL
    };

    const confirmModal = document.getElementById('confirmModal');
    const modalContent = confirmModal.querySelector('.modal-content');

    modalContent.innerHTML = `
        <div class="loader" style="width: 40px; height: 40px; margin: 20px auto;"></div>
        <h3>Checking Supplier Information...</h3>
        <p>Please wait while we verify the purchase order details.</p>
    `;
    confirmModal.style.display = 'flex';

    try {
        const result = await checkMissingSuppliers(googleSheetURL);
        const { missingOrders, completedOrders, filteredSpecsForEditor } = result;

        // Populate the global categoriesWithSpecs with the fetched data
        // (This is now managed within specEditor.js upon openSpecEditorModal)

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
                    <button class="btn btn-success" id="proceedSpecEditorBtn">Proceed Anyway</button>
                    <button class="btn" onclick="closeModal('confirmModal')">Cancel</button>
                </div>
            `;
            // Attach event listener for "Proceed Anyway"
            document.getElementById('proceedSpecEditorBtn').onclick = () => {
                closeModal('confirmModal');
                openSpecEditorModal(filteredSpecsForEditor, currentRequestDataForSpecs);
            };

        } else {
            closeModal('confirmModal');
            openSpecEditorModal(filteredSpecsForEditor, currentRequestDataForSpecs);
        }
    } catch (err) {
        closeModal('confirmModal');
        showError("Failed to check suppliers: " + err.message);
    }
}

// Function to handle "Cancel" button click
async function handleMarkCancel(event) {
    const btn = event.target;
    const timestamp = btn.dataset.timestamp;
    const requesterName = btn.dataset.requester;

    const requestData = { timestamp, requesterName };

    const confirmCancelModal = document.getElementById('confirmCancelModal');
    confirmCancelModal.style.display = 'flex';

    // Set up the actual confirmation action
    document.getElementById('confirmCancelBtn').onclick = confirmMarkCancel(requestData);
}


// Function to open the custom order modal
function createCustomOrder() {
    document.getElementById('customOrderModal').style.display = 'flex';
    document.getElementById('requesterName').value = '';
    document.getElementById('notes').value = '';
}

// Function to submit custom order
async function submitCustomOrderHandler() {
    const requesterName = document.getElementById('requesterName').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!requesterName) {
        showToast("Requester Name cannot be empty.", "error");
        return;
    }

    // Show loading state in the modal
    const customOrderModalContent = document.getElementById('customOrderModal').querySelector('.modal-content');
    customOrderModalContent.innerHTML = `
        <div class="loader" style="width: 40px; height: 40px; margin: 20px auto;"></div>
        <h3>Submitting Custom Order...</h3>
        <p>Please wait, this may take a moment.</p>
    `;

    try {
        const result = await submitCustomOrder(requesterName, notes);
        closeModal('customOrderModal');
        if (result.success) {
            showToast("✅ Custom order submitted successfully!", "success");
            loadRequests(); // Refresh requests to show the new custom order
        } else {
            showToast(`❌ Custom order failed: ${result.error || "Unknown error"}`, "error");
        }
    } catch (error) {
        closeModal('customOrderModal');
        showToast("Error submitting custom order: " + error.message, "error");
    }
}


// --- DOM Ready Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Load initial PO request cards
    loadRequests();

    // Attach event listener for "Try Again" button in error state
    document.getElementById('tryAgainBtn')?.addEventListener('click', loadRequests);

    // Attach event listener for "Create Custom Order" button
    document.getElementById('createCustomOrderBtn')?.addEventListener('click', createCustomOrder);

    // Attach event listener for "Submit Custom Order" button inside the modal
    document.getElementById('submitCustomOrderBtn')?.addEventListener('click', submitCustomOrderHandler);


    // Attach event listeners for spec editor navigation buttons
    document.getElementById('prevCategoryBtn')?.addEventListener('click', () => navigateCategory('prev'));
    document.getElementById('nextCategoryBtn')?.addEventListener('click', () => navigateCategory('next'));


    // Wire up Save Specs & Confirm PO button
    document.getElementById('saveSpecsAndConfirmBtn')?.addEventListener('click', () => {
        saveCurrentSpec(); // Ensure the current textarea content is saved before submission
        const markDoneFunction = confirmMarkDone({
            currentRequestDataForSpecs,
            temporaryEditedSpecs: getTemporaryEditedSpecs(), // Pass the shared temporary edited specs
            categoriesWithSpecs: getCategoriesWithSpecs(), // Pass the shared categories with specs
            currentCategoryIndex: getCurrentCategoryIndex(), // Pass the shared current category index
        });
        markDoneFunction(); // Execute the confirmation logic
    });

    // Event Delegation for "Mark Done" and "Cancel" buttons on dynamically created cards
    document.getElementById('requests-container').addEventListener('click', (event) => {
        if (event.target.classList.contains('mark-done-btn')) {
            handleMarkDone(event);
        } else if (event.target.classList.contains('cancel-btn')) {
            handleMarkCancel(event);
        }
    });

    // Close modals on escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('customOrderModal');
            closeModal('specEditorModal');
            closeModal('confirmModal');
            closeModal('confirmCancelModal');
        }
    });
});
