let categoriesWithSpecs = [];
let currentCategoryIndex = 0;
let temporaryEditedSpecs = {};

export function bindSpecEditorNavigation({
  categoriesWithSpecs,
  currentRequestDataForSpecs,
  temporaryEditedSpecs,
  confirmMarkDone
}) {
  let currentCategoryIndex = 0;

  const saveBtn = document.getElementById('saveSpecsAndConfirmBtn');
  const textarea = document.getElementById('specsTextarea');

  saveBtn?.addEventListener('click', () => {
    // ✅ Save the current textarea content
    if (categoriesWithSpecs.length > 0) {
      const currentCategory = categoriesWithSpecs[currentCategoryIndex];
      temporaryEditedSpecs[currentCategory.category] = textarea.value;
    }

    // ✅ Final confirmation call
    if (currentRequestDataForSpecs) {
      confirmMarkDone(); // <-- must be passed from outside
    } else {
      console.error("No request data to confirm. currentRequestDataForSpecs is null.");
      alert("Error: No active request to mark done.");
    }

    // ✅ Hide modal
    document.getElementById('specEditorModal').style.display = 'none';
  });

  const prevBtn = document.getElementById('prevCategoryBtn');
  const nextBtn = document.getElementById('nextCategoryBtn');
  const saveBtn = document.getElementById('saveSpecsAndConfirmBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      saveCurrentSpec();
      if (currentCategoryIndex > 0) currentCategoryIndex--;
      displayCurrentCategorySpecs();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      saveCurrentSpec();
      if (currentCategoryIndex < categoriesWithSpecs.length - 1) currentCategoryIndex++;
      displayCurrentCategorySpecs();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveCurrentSpec();
      alert("Saving final specs (you’ll later send to backend)");
    });
  }
  // Cancel and Close Button Handlers
  document.getElementById('cancelSpecEditorBtn')?.addEventListener('click', () => {
    document.getElementById('specEditorModal').style.display = 'none';
  });
  
  document.getElementById('closeSpecModalBtn')?.addEventListener('click', () => {
    document.getElementById('specEditorModal').style.display = 'none';
  });

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


