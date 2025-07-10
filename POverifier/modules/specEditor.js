let categoriesWithSpecs = [];
let currentCategoryIndex = 0;
let temporaryEditedSpecs = {};

export function bindSpecEditorNavigation({
  categoriesWithSpecs,
  temporaryEditedSpecs,
  setCurrentCategoryIndex
}) {
  let currentIndex = 0;
  setCurrentCategoryIndex(currentIndex); // set initial index

  const textarea = document.getElementById('specsTextarea');
  const categoryTitle = document.getElementById('specCategoryTitle');

  const renderCategory = () => {
    const cat = categoriesWithSpecs[currentIndex];
    const saved = temporaryEditedSpecs[cat.category] || '';
    categoryTitle.textContent = cat.category;
    textarea.value = Array.isArray(saved) ? saved.join('\n') : saved;
    setCurrentCategoryIndex(currentIndex); // update shared index
  };

  // ✅ Handle Previous button
  document.getElementById('prevCategoryBtn')?.addEventListener('click', () => {
    if (currentIndex > 0) {
      saveCurrentSpec(); // save before switching
      currentIndex--;
      renderCategory();
    }
  });

  // ✅ Handle Next button
  document.getElementById('nextCategoryBtn')?.addEventListener('click', () => {
    if (currentIndex < categoriesWithSpecs.length - 1) {
      saveCurrentSpec();
      currentIndex++;
      renderCategory();
    }
  });

  // ✅ Save current specs into memory
  const saveCurrentSpec = () => {
    const currentCategory = categoriesWithSpecs[currentIndex];
    temporaryEditedSpecs[currentCategory.category] = textarea.value.split('\n').filter(line => line.trim() !== '');
  };

  // Initial render
  renderCategory();
}



export function openSpecEditorModal(filteredSpecs) {
  categoriesWithSpecs = filteredSpecs;
  currentCategoryIndex = 0;
  temporaryEditedSpecs = {};
  displayCurrentCategorySpecs();
  document.getElementById('specEditorModal').style.display = 'flex';
}

function displayCurrentCategorySpecs() {
  const title = document.getElementById('currentCategoryTitle');
  const textarea = document.getElementById('specsTextarea');
  const category = categoriesWithSpecs[currentCategoryIndex];

  if (!category) return;

  title.textContent = `Category: ${category.category}`;
  textarea.value = category.specifications.join('\n');
  textarea.disabled = false;

  document.getElementById('prevCategoryBtn').disabled = currentCategoryIndex === 0;
  document.getElementById('nextCategoryBtn').disabled = currentCategoryIndex === categoriesWithSpecs.length - 1;
}

function saveCurrentSpec() {
  const category = categoriesWithSpecs[currentCategoryIndex];
  const textarea = document.getElementById('specsTextarea');
  if (category && textarea) {
    temporaryEditedSpecs[category.category] = textarea.value.split('\n').filter(line => line.trim() !== '');
  }
}


