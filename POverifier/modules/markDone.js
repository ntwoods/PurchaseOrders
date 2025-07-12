import { closeModal, showToast } from './utils.js';
import { loadRequests } from './loadRequests.js';
import { API_URL } from './api.js'; // Use the consistent API_URL

// This function needs to be called with the state variables from main.js
export function confirmMarkDone({
  currentRequestDataForSpecs,
  temporaryEditedSpecs,
  categoriesWithSpecs, // This can be removed if saveCurrentSpec is called externally
  currentCategoryIndex // This can be removed if saveCurrentSpec is called externally
}) {
  return async function () {
    console.log("confirmMarkDone called.");

    // It's crucial to save the current specs from the textarea right before submission
    // This call should be handled by the click listener for 'saveSpecsAndConfirmBtn' in main.js
    // For robustness, we will ensure it here too, but main.js should ideally manage it.
    const specsTextarea = document.getElementById('specsTextarea');
    const currentCategory = categoriesWithSpecs[currentCategoryIndex];
    if (specsTextarea && currentCategory?.category) {
        temporaryEditedSpecs[currentCategory.category] = specsTextarea.value
            .split('\n')
            .filter(line => line.trim() !== '');
        console.log(`Saved final specs for '${currentCategory.category}':`, temporaryEditedSpecs[currentCategory.category]);
    } else {
        console.warn("Could not save final specs from textarea before submission.");
    }

    if (!currentRequestDataForSpecs?.timestamp || !currentRequestDataForSpecs?.requesterName) {
      console.error("Missing PO metadata:", currentRequestDataForSpecs);
      showToast("Error: Missing PO details. Cannot submit.", "error");
      closeModal('confirmModal');
      return;
    }

    // Show a loading state in the confirm modal
    document.getElementById('specEditorModal').style.display = 'none'; // Close spec editor
    const confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'flex'; // Show confirm modal
    const confirmModalContent = confirmModal.querySelector('.modal-content');
    confirmModalContent.innerHTML = `
      <div class="loader" style="width: 40px; height: 40px; margin: 20px auto;"></div>
      <h3>Submitting PO Request...</h3>
      <p>Please wait, this may take a moment.</p>
    `;

    try {
      const payload = {
        action: 'markDone',
        timestamp: currentRequestDataForSpecs.timestamp,
        requesterName: currentRequestDataForSpecs.requesterName,
        temporarySpecs: JSON.stringify(temporaryEditedSpecs) // Send all edited specs
      };

      const formData = new URLSearchParams();
      for (const key in payload) {
        formData.append(key, payload[key]);
      }

      console.log("📦 Sending markDone payload:", payload);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(`HTTP error: ${response.status} – ${raw}`);
      }

      const result = await response.json();
      closeModal('confirmModal');

      if (result.success) {
        showToast("✅ PO marked as done!", "success");
        loadRequests(); // Reload PO cards
        // Clear temporary edited specs after successful submission
        for (const key in temporaryEditedSpecs) {
          delete temporaryEditedSpecs[key];
        }
      } else {
        showToast(`❌ PO failed: ${result.error || "Unknown server error"}`, "error");
      }
    } catch (err) {
      console.error("PO submission error:", err);
      closeModal('confirmModal');
      showToast("Error submitting PO: " + err.message, "error");
    }
  };
}
