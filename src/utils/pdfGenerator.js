import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format Firestore timestamp
function formatTimestamp(ts) {
  if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
  if (ts?.toDate) return ts.toDate().toLocaleString();
  return '';
}

export function generateSalePdf(sale) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Sale Receipt', 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${formatTimestamp(sale.soldAt)}`, 14, 32);
  doc.text(`Customer: ${sale.customerName || 'N/A'}`, 14, 40);

  // Items table
  const rows = (sale.items || []).map(item => [
    item.name || '—',
    String(item.qty ?? 1),
    `Rs. ${item.salePrice?.toLocaleString() ?? '0'}`,
    `Rs. ${((item.salePrice ?? 0) * (item.qty ?? 1)).toLocaleString()}`,
  ]);

  autoTable(doc, {
    head: [['Item', 'Qty', 'Unit Price', 'Subtotal']],
    body: rows,
    startY: 50,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  const finalY = doc.lastAutoTable?.finalY ?? 50;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total:  Rs. ${sale.totalPrice?.toLocaleString() ?? '0'}`, 14, finalY + 12);
  doc.text(`Profit: Rs. ${sale.totalProfit?.toLocaleString() ?? '0'}`, 14, finalY + 20);

  doc.save(`sale_${sale.id}.pdf`);
}

export function generatePurchasePdf(purchase) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Purchase Invoice', 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${formatTimestamp(purchase.purchasedAt)}`, 14, 32);
  doc.text(`Supplier: ${purchase.supplierName || 'N/A'}`, 14, 40);

  const rows = (purchase.items || []).map(item => [
    item.name || '—',
    String(item.qty ?? 1),
    `Rs. ${item.purchasePrice?.toLocaleString() ?? '0'}`,
    `Rs. ${((item.purchasePrice ?? 0) * (item.qty ?? 1)).toLocaleString()}`,
  ]);

  autoTable(doc, {
    head: [['Item', 'Qty', 'Unit Price', 'Subtotal']],
    body: rows,
    startY: 50,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  const finalY = doc.lastAutoTable?.finalY ?? 50;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Cost: Rs. ${purchase.totalCost?.toLocaleString() ?? '0'}`, 14, finalY + 12);

  doc.save(`purchase_${purchase.id}.pdf`);
}
