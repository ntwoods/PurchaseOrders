import { closeModal, showToast } from './utils.js';  // if you modularized these
import { loadRequests } from './loadRequests.js';    // reload PO cards

// Pass these when calling the function
export function confirmMarkDone({
  currentRequestDataForSpecs,
  temporaryEditedSpecs,
  categoriesWithSpecs,
  currentCategoryIndex,
  API_URL2
}) {
  return async function () {
    console.log("confirmMarkDone called.");

    const specsTextarea = document.getElementById('specsTextarea');
    const currentCategory = categoriesWithSpecs[currentCategoryIndex];

    if (specsTextarea && currentCategory?.category) {
      temporaryEditedSpecs[currentCategory.category] = specsTextarea.value
        .split('\n')
        .filter(line => line.trim() !== '');
      console.log(`Saved specs for '${currentCategory.category}':`, temporaryEditedSpecs[currentCategory.category]);
    } else {
      console.error("Specs textarea or current category missing.");
      showToast("Error: Cannot save current specifications.", "error");
      return;
    }

    if (!currentRequestDataForSpecs?.timestamp || !currentRequestDataForSpecs?.requesterName) {
      console.error("Missing PO metadata:", currentRequestDataForSpecs);
      showToast("Error: Missing PO details. Cannot submit.", "error");
      closeModal();
      return;
    }

    document.getElementById('specEditorModal').style.display = 'none';
    document.getElementById('confirmModal').style.display = 'flex';
    const confirmModalContent = document.getElementById('confirmModal').querySelector('.modal-content');
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
        temporarySpecs: JSON.stringify(temporaryEditedSpecs)
      };

      const formData = new URLSearchParams();
      for (const key in payload) {
        formData.append(key, payload[key]);
      }

      console.log("📦 Sending:", formData.toString());

      const response = await fetch(API_URL2, {
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
      closeModal();

      if (result.success) {
        showToast("✅ PO marked as done!", "success");
        loadRequests();
        // clear specs
        Object.keys(temporaryEditedSpecs).forEach(k => delete temporaryEditedSpecs[k]);
      } else {
        showToast(`❌ PO failed: ${result.error || "Unknown server error"}`, "error");
      }
    } catch (err) {
      console.error("PO submission error:", err);
      closeModal();
      showToast("Error submitting PO: " + err.message, "error");
    }
  };
}
