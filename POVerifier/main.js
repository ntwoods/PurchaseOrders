import { loadRequests } from './modules/loadRequests.js';
import { bindSpecEditorNavigation } from './modules/specEditor.js';

document.addEventListener('DOMContentLoaded', () => {
  loadRequests();
  bindSpecEditorNavigation();
});
