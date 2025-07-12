import { closeModal, showToast } from './utils.js';
import { loadRequests } from './loadRequests.js';
import { API_URL } from './api.js';

export function confirmMarkCancel(requestData) {
    return async function () {
        console.log("confirmMarkCancel called for:", requestData);

        if (!requestData?.timestamp || !requestData?.requesterName) {
            console.error("Missing PO metadata for cancel:", requestData);
            showToast("Error: Missing PO details. Cannot cancel.", "error");
            closeModal('confirmCancelModal');
            return;
        }

        const confirmCancelModal = document.getElementById('confirmCancelModal');
        const confirmCancelModalContent = confirmCancelModal.querySelector('.modal-content');
        confirmCancelModalContent.innerHTML = `
            <div class="loader" style="width: 40px; height: 40px; margin: 20px auto;"></div>
            <h3>Cancelling PO Request...</h3>
            <p>Please wait, this may take a moment.</p>
        `;

        try {
            const payload = {
                action: 'markCancel',
                timestamp: requestData.timestamp,
                requesterName: requestData.requesterName
            };

            const formData = new URLSearchParams();
            for (const key in payload) {
                formData.append(key, payload[key]);
            }

            console.log("📦 Sending markCancel payload:", payload);

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
            closeModal('confirmCancelModal');

            if (result.success) {
                showToast("✅ PO marked as cancelled!", "success");
                loadRequests(); // Reload PO cards
            } else {
                showToast(`❌ PO cancellation failed: ${result.error || "Unknown server error"}`, "error");
            }
        } catch (err) {
            console.error("PO cancellation error:", err);
            closeModal('confirmCancelModal');
            showToast("Error cancelling PO: " + err.message, "error");
        }
    };
}
