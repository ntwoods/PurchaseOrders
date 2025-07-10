export const API_URL = 'https://script.google.com/macros/s/AKfycbxnXt8Ti_RvyfVMRFGbZ-qCUAK-FhmRlN0-B1CDxdKGcVizExq6-MSNMHNCQIDekiiL/exec';
export const API_URL2 = API_URL; // Same endpoint for now


export async function checkMissingSuppliers(googleSheetURL, apiUrl = API_URL) {
  try {
    let csvUrl = googleSheetURL;
    if (googleSheetURL.includes('/edit')) {
      const match = googleSheetURL.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim()));
    const missingOrders = [];
    const completedOrders = [];
    const categoriesWithSuppliers = new Set();

    for (let i = 0; i < rows.length; i++) {
      const [order1, category1, supplier1, , , order2, category2, supplier2] = rows[i];

      if (order1?.toLowerCase().includes('order-')) {
        const info = `${order1} (${category1})`;
      if (!supplier1 || supplier1.trim().length === 0 || supplier1.toLowerCase().includes('supplier')) {
        missingOrders.push(info);
      } else {
          completedOrders.push(`${info} - ${supplier1}`);
          categoriesWithSuppliers.add(category1);
        }
      }

      if (order2?.toLowerCase().includes('order-')) {
        const info = `${order2} (${category2})`;
        if (!supplier2 || supplier2.toLowerCase() === 'supplier name') {
          missingOrders.push(info);
        } else {
          completedOrders.push(`${info} - ${supplier2}`);
          categoriesWithSuppliers.add(category2);
        }
      }
    }

    // Fetch specifications from backend
    const specsUrl = `${apiUrl}?action=getSpecificationsForAllCategories&sourceUrl=${encodeURIComponent(googleSheetURL)}`;
    const specsResp = await fetch(specsUrl);
    const allSpecs = await specsResp.json();

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
    throw new Error('Unable to check suppliers. Make sure the sheet is public.');
  }
}
