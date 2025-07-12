import { API_URL } from './api.js';
import { displayRequests, showError, showLoading } from './utils.js';

let requestsData = []; // Store requests data globally within this module

export async function loadRequests() {
  showLoading();

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.success) {
      requestsData = data.data;
      displayRequests(requestsData);
    } else {
      throw new Error(data.error || 'Failed to load requests');
    }
  } catch (error) {
    console.error("Error loading requests:", error);
    showError(error.message);
  }
}

// Export requestsData so main.js can access it
export function getRequestsData() {
    return requestsData;
}
