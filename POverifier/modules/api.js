export const API_URL = 'https://script.google.com/macros/s/AKfycbxnXt8Ti_RvyfVMRFGbZ-qCUAK-FhmRlN0-B1CDxdKGcVizExq6-MSNMHNCQIDekiiL/exec';

export async function checkMissingSuppliers(googleSheetURL) {
  try {
    let csvUrl = googleSheetURL;
    if (googleSheetURL.includes('/edit')) {
      const match = googleSheetURL.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    const csvText = await response.text();

    // Basic CSV parsing - assuming no commas within fields for simplicity based on original code
    const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim()));
    const missingOrders = [];
    const completedOrders = [];
    const categoriesWithSuppliers = new Set();

    // Assuming a consistent structure where order is in column A/F, category in B/G, supplier in C/H
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 3) { // Check for first set of columns (Order 1, Category 1, Supplier 1)
            const order1 = row[0];
            const category1 = row[1];
            const supplier1 = row[2];

            if (order1?.toLowerCase().includes('order-')) {
                const info = `${order1} (${category1})`;
                if (!supplier1 || supplier1.trim().length === 0 || supplier1.toLowerCase().includes('supplier')) {
                    missingOrders.push(info);
                } else {
                    completedOrders.push(`${info} - ${supplier1}`);
                    if (category1) categoriesWithSuppliers.add(category1);
                }
            }
        }
        
        if (row.length >= 8) { // Check for second set of columns (Order 2, Category 2, Supplier 2)
            const order2 = row[5]; // Assuming column F (index 5)
            const category2 = row[6]; // Assuming column G (index 6)
            const supplier2 = row[7]; // Assuming column H (index 7)

            if (order2?.toLowerCase().includes('order-')) {
                const info = `${order2} (${category2})`;
                if (!supplier2 || supplier2.trim().length === 0 || supplier2.toLowerCase().includes('supplier')) {
                    missingOrders.push(info);
                } else {
                    completedOrders.push(`${info} - ${supplier2}`);
                    if (category2) categoriesWithSuppliers.add(category2);
                }
            }
        }
    }

    // Fetch specifications from backend
    const specsUrl = `${API_URL}?action=getSpecificationsForAllCategories&sourceUrl=${encodeURIComponent(googleSheetURL)}`;
    const specsResp = await fetch(specsUrl);
    if (!specsResp.ok) {
        throw new Error(`Failed to fetch specifications: ${specsResp.statusText}`);
    }
    const allSpecs = await specsResp.json();
  
  // In api.js, inside checkMissingSuppliers:
  const filteredSpecsForEditor = [];
  categoriesWithSuppliers.forEach(category => {
      const key = Object.keys(allSpecs).find(
          k => k.trim().toLowerCase() === category.trim().toLowerCase()
      );
  
      if (key) {
          filteredSpecsForEditor.push({
              category,
              specifications: Array.isArray(allSpecs[key])
                  ? allSpecs[key]
                  : [String(allSpecs[key])]
          });
      }
  });
  return { missingOrders, completedOrders, filteredSpecsForEditor };
  } catch (e) {
    console.error('Error checking suppliers:', e);
    throw new Error('Unable to check suppliers. Make sure the sheet is public and accessible.');
  }
}

export async function submitCustomOrder(requesterName, notes) {
    try {
        const payload = {
            action: 'createCustomOrder',
            requesterName,
            notes
        };

        const formData = new URLSearchParams();
        for (const key in payload) {
            formData.append(key, payload[key]);
        }

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
        return result;

    } catch (error) {
        console.error("Error submitting custom order:", error);
        throw new Error("Failed to submit custom order: " + error.message);
    }
}
