// Removed bindSpecEditorNavigation as its logic is now primarily handled by displayCurrentCategorySpecs
// and direct event listeners in main.js
let categoriesWithSpecs = [];
let currentCategoryIndex = 0;
let temporaryEditedSpecs = {}; // Stores changes before final submission

export function openSpecEditorModal(filteredSpecs, requestData) {
  categoriesWithSpecs = filteredSpecs;
  currentCategoryIndex = 0; // Reset index when opening modal
  temporaryEditedSpecs = {}; // Clear previous edits

  // Populate request details in the modal header
  document.getElementById('specEditorTimestamp').textContent = new Date(requestData.timestamp).toLocaleString();
  document.getElementById('specEditorRequester').textContent = requestData.requesterName;
  const sourceUrlDisplay = document.getElementById('specEditorSourceUrlDisplay');
  sourceUrlDisplay.innerHTML = `<a href="${requestData.googleSheetURL}" target="_blank" style="color:#2196f3; text-decoration:none;">🔗 View Source Sheet</a>`;

  displayCurrentCategorySpecs();
  document.getElementById('specEditorModal').style.display = 'flex';
}

export function displayCurrentCategorySpecs() {
  const title = document.getElementById('currentCategoryTitle');
  const textarea = document.getElementById('specsTextarea');
  const prevBtn = document.getElementById('prevCategoryBtn');
  const nextBtn = document.getElementById('nextCategoryBtn');

  const category = categoriesWithSpecs[currentCategoryIndex];

  if (!category) {
    title.textContent = 'No Categories';
    textarea.value = '';
    textarea.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  title.textContent = `Category: ${category.category}`;
  
  // Load existing temporary edits or original specifications
  const specsToDisplay = temporaryEditedSpecs[category.category] || category.specifications;
  textarea.value = Array.isArray(specsToDisplay) ? specsToDisplay.join('\n') : String(specsToDisplay);
  textarea.disabled = false;

  prevBtn.disabled = currentCategoryIndex === 0;
  nextBtn.disabled = currentCategoryIndex === categoriesWithSpecs.length - 1;
}

export function saveCurrentSpec() {
  const category = categoriesWithSpecs[currentCategoryIndex];
  const textarea = document.getElementById('specsTextarea');
  if (category && textarea) {
    temporaryEditedSpecs[category.category] = textarea.value.split('\n').filter(line => line.trim() !== '');
  }
}

export function navigateCategory(direction) {
  saveCurrentSpec(); // Always save before navigating

  if (direction === 'next' && currentCategoryIndex < categoriesWithSpecs.length - 1) {
    currentCategoryIndex++;
  } else if (direction === 'prev' && currentCategoryIndex > 0) {
    currentCategoryIndex--;
  }
  displayCurrentCategorySpecs();
}

// Export shared state for main.js to access
export function getCategoriesWithSpecs() {
    return categoriesWithSpecs;
}

export function getTemporaryEditedSpecs() {
    return temporaryEditedSpecs;
}

export function getCurrentCategoryIndex() {
    return currentCategoryIndex;
}
