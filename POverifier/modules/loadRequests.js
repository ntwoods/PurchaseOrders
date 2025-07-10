import { API_URL } from './api.js';
import { displayRequests, showError, showLoading } from './utils.js';

let requestsData = [];

export async function loadRequests() {
  showLoading();

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.success) {
      requestsData = data.data;
      displayRequests(requestsData);
    } else {
      throw new Error(data.error || 'Failed to load requests');
    }
  } catch (error) {
    showError(error.message);
  }
}
