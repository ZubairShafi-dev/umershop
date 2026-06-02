import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to format Firestore timestamp
function formatTimestamp(ts) {
  if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
  if (ts?.toDate) return ts.toDate().toLocaleString();
  return '';
}

// Fetch shop settings from Firestore
async function getShopSettings() {
  try {
    const docRef = doc(db, 'settings', 'shop');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        name: data.name || 'Umar Mobile & Accessories',
        ownerName: data.ownerName || 'Umar Shafi',
        address: data.address || 'Main Bazaar, Near Clock Tower',
        phone: data.phone || '0300-6317013'
      };
    }
  } catch (err) {
    console.error("Error fetching shop settings for PDF:", err);
  }
  return {
    name: 'Umar Mobile & Accessories',
    ownerName: 'Umar Shafi',
    address: 'Main Bazaar, Near Clock Tower',
    phone: '0300-6317013'
  };
}

// Function to draw a highly professional PAID stamp
function drawPaidStamp(doc, x, y) {
  // Emerald Green color scheme for PAID
  doc.setDrawColor(16, 185, 129);
  doc.setTextColor(16, 185, 129);
  
  // Outer thick rounded border
  doc.setLineWidth(1.2);
  doc.roundedRect(x, y, 36, 14, 2, 2, 'D');
  
  // Inner thin rounded border
  doc.setLineWidth(0.4);
  doc.roundedRect(x + 1, y + 1, 34, 12, 1.5, 1.5, 'D');
  
  // PAID Stamp text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PAID", x + 18, y + 9.5, { align: 'center' });
}

// Function to draw a highly professional RECEIVED stamp for purchase invoices
function drawReceivedStamp(doc, x, y) {
  // Royal Blue color scheme for RECEIVED
  doc.setDrawColor(59, 130, 246);
  doc.setTextColor(59, 130, 246);
  
  // Outer thick rounded border
  doc.setLineWidth(1.2);
  doc.roundedRect(x, y, 36, 14, 2, 2, 'D');
  
  // Inner thin rounded border
  doc.setLineWidth(0.4);
  doc.roundedRect(x + 1, y + 1, 34, 12, 1.5, 1.5, 'D');
  
  // RECEIVED Stamp text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RECEIVED", x + 18, y + 9.5, { align: 'center' });
}

export async function generateSalePdf(sale) {
  const settings = await getShopSettings();
  const doc = new jsPDF();

  // 1. LEFT SIDE - Shop Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(settings.name, 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Address: ${settings.address}`, 14, 28);
  doc.text(`Contact: ${settings.phone}`, 14, 33);

  // 2. RIGHT SIDE - Owner & Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(`Proprietor: ${settings.ownerName}`, 196, 22, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Date: ${formatTimestamp(sale.soldAt)}`, 196, 28, { align: 'right' });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 196, 33, { align: 'right' });

  // 3. Elegant horizontal line divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // 4. Document title and PAID Stamp
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("SALE RECEIPT", 14, 48);

  // Draw the Paid Stamp next to the title
  drawPaidStamp(doc, 160, 42);

  // 5. Items Table
  const rows = (sale.items || []).map(item => [
    item.name || '—',
    String(item.qty ?? 1),
    `Rs. ${item.salePrice?.toLocaleString() ?? '0'}`,
    `Rs. ${((item.salePrice ?? 0) * (item.qty ?? 1)).toLocaleString()}`,
  ]);

  autoTable(doc, {
    head: [['Item', 'Qty', 'Unit Price', 'Subtotal']],
    body: rows,
    startY: 60,
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      font: 'helvetica',
      cellPadding: 3,
      textColor: [51, 65, 85]
    },
    headStyles: { 
      fillColor: [15, 23, 42], // slate-900 for absolute luxury theme
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      1: { halign: 'center' }, // center-align quantity
      2: { halign: 'right' },  // right-align unit price
      3: { halign: 'right' }   // right-align subtotal
    }
  });

  const finalY = doc.lastAutoTable?.finalY ?? 60;

  // 6. Styled Totals Dashboard Box
  const total = sale.totalAmount ?? sale.totalPrice ?? rows.reduce((sum, r) => sum + parseFloat(r[3].replace('Rs. ', '').replace(/,/g, '')), 0);
  const profit = sale.totalProfit ?? (total ? total - (sale.totalCost || 0) : 0);

  // Draw Background Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(130, finalY + 8, 66, 26, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200 border
  doc.setLineWidth(0.5);
  doc.roundedRect(130, finalY + 8, 66, 26, 1.5, 1.5, 'D');

  // Draw Total Price Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Grand Total:", 134, finalY + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${total.toLocaleString()}`, 192, finalY + 16, { align: 'right' });

  // Draw Net Profit Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Net Profit:", 134, finalY + 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // emerald-500 green
  doc.text(`Rs. ${profit.toLocaleString()}`, 192, finalY + 26, { align: 'right' });

  // Footer note
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Thank you for your business. Software powered by Mobiv ERP.", 14, finalY + 45);

  doc.save(`sale_${sale.id}.pdf`);
}

export async function generatePurchasePdf(purchase) {
  const settings = await getShopSettings();
  const doc = new jsPDF();

  // 1. LEFT SIDE - Shop Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(settings.name, 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Address: ${settings.address}`, 14, 28);
  doc.text(`Contact: ${settings.phone}`, 14, 33);

  // 2. RIGHT SIDE - Owner & Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(`Proprietor: ${settings.ownerName}`, 196, 22, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Date: ${formatTimestamp(purchase.purchasedAt)}`, 196, 28, { align: 'right' });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Supplier: ${purchase.supplierName || 'N/A'}`, 196, 33, { align: 'right' });

  // 3. Elegant horizontal line divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // 4. Document title and RECEIVED Stamp
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("PURCHASE INVOICE", 14, 48);

  // Draw the Received Stamp next to the title
  drawReceivedStamp(doc, 160, 42);

  // 5. Items Table
  const rows = (purchase.items || []).map(item => [
    item.name || '—',
    String(item.qty ?? 1),
    `Rs. ${item.purchasePrice?.toLocaleString() ?? '0'}`,
    `Rs. ${((item.purchasePrice ?? 0) * (item.qty ?? 1)).toLocaleString()}`,
  ]);

  autoTable(doc, {
    head: [['Item', 'Qty', 'Unit Price', 'Subtotal']],
    body: rows,
    startY: 60,
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      font: 'helvetica',
      cellPadding: 3,
      textColor: [51, 65, 85]
    },
    headStyles: { 
      fillColor: [15, 23, 42], // slate-900 for absolute luxury theme
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      1: { halign: 'center' }, // center-align quantity
      2: { halign: 'right' },  // right-align unit price
      3: { halign: 'right' }   // right-align subtotal
    }
  });

  const finalY = doc.lastAutoTable?.finalY ?? 60;

  // 6. Styled Totals Dashboard Box
  // Draw Background Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(130, finalY + 8, 66, 16, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200 border
  doc.setLineWidth(0.5);
  doc.roundedRect(130, finalY + 8, 66, 16, 1.5, 1.5, 'D');

  // Draw Total Price Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Total Cost:", 134, finalY + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${purchase.totalCost?.toLocaleString() ?? '0'}`, 192, finalY + 18, { align: 'right' });

  // Footer note
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Generated via Inventory Portal. Software powered by Mobiv ERP.", 14, finalY + 35);

  doc.save(`purchase_${purchase.id}.pdf`);
}
