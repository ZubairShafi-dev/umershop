import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSalePdf } from '../utils/pdfGenerator.js?v=3';
import { X, Edit, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    customerIdNumber: '',
    items: []
  });

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('soldAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSales(data);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  const handleDownloadPdf = () => {
    if (selectedSale) {
      generateSalePdf(selectedSale);
    }
  };

  const handleDeleteSale = async (sale) => {
    if (!window.confirm("Are you sure you want to delete this sale? This will revert the inventory items back to stock.")) return;

    try {
      await runTransaction(db, async (transaction) => {
        for (const item of (sale.items || [])) {
          if (item.type === 'mobile') {
            const mobileRef = doc(db, 'mobiles', item.id);
            const mobileSnap = await transaction.get(mobileRef);
            if (mobileSnap.exists()) {
              transaction.update(mobileRef, { status: 'Available', updatedAt: new Date().toISOString() });
            }
          } else {
            const accRef = doc(db, 'accessories', item.id);
            const accSnap = await transaction.get(accRef);
            if (accSnap.exists()) {
              const currentQty = accSnap.data().quantity || 0;
              transaction.update(accRef, { 
                quantity: currentQty + (item.qty || 1),
                updatedAt: new Date().toISOString()
              });
            }
          }
        }
        const saleRef = doc(db, 'sales', sale.id);
        transaction.delete(saleRef);
      });
      toast.success("Sale deleted and inventory reverted successfully!");
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Failed to delete sale: " + error.message);
    }
  };

  const startEdit = (sale) => {
    setEditingSale(sale);
    setEditForm({
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || '',
      customerIdNumber: sale.customerIdNumber || '',
      items: (sale.items || []).map(item => ({ ...item }))
    });
  };

  const handleItemPriceChange = (index, value) => {
    const updatedItems = [...editForm.items];
    updatedItems[index].salePrice = parseFloat(value) || 0;
    updatedItems[index].profit = (updatedItems[index].salePrice - updatedItems[index].purchasePrice) * updatedItems[index].qty;
    setEditForm({ ...editForm, items: updatedItems });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const updatedTotalAmount = editForm.items.reduce((sum, item) => sum + (item.salePrice * item.qty), 0);
      const updatedTotalProfit = editForm.items.reduce((sum, item) => sum + (item.profit || 0), 0);

      const saleRef = doc(db, 'sales', editingSale.id);
      await updateDoc(saleRef, {
        customerName: editForm.customerName,
        customerPhone: editForm.customerPhone,
        customerIdNumber: editForm.customerIdNumber,
        items: editForm.items,
        totalAmount: updatedTotalAmount,
        totalProfit: updatedTotalProfit,
        updatedAt: new Date().toISOString()
      });
      toast.success("Sale details updated successfully!");
      setEditingSale(null);
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Failed to update sale.");
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      <h1 className="text-2xl font-bold mb-4">Sales History</h1>
      <div className="overflow-x-auto rounded-lg shadow-lg bg-slate-800">
        <table className="w-full border-collapse">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">Customer</th>
              <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">Items (Qty)</th>
              <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">Total</th>
              <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">Profit</th>
              <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr
                key={sale.id}
                className="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                onClick={() => openModal(sale)}
              >
                <td className="p-3">
                  {sale.soldAt?.seconds
                    ? new Date(sale.soldAt.seconds * 1000).toLocaleString('en-PK')
                    : typeof sale.soldAt === 'string'
                    ? new Date(sale.soldAt).toLocaleString('en-PK')
                    : '—'}
                </td>
                <td className="p-3">{sale.customerName || '—'}</td>
                <td className="p-3">
                  {sale.items?.reduce((sum, item) => sum + (item.qty || 1), 0) || 0}
                </td>
                <td className="p-3 text-emerald-400 font-semibold">Rs. {sale.totalAmount?.toLocaleString() ?? '—'}</td>
                <td className="p-3 text-indigo-400">Rs. {sale.totalProfit?.toLocaleString() ?? '—'}</td>
                <td className="p-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => startEdit(sale)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-primary-400 inline-flex items-center transition-colors"
                    title="Edit Sale"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSale(sale)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-rose-400 inline-flex items-center transition-colors"
                    title="Delete Sale"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedSale && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-slate-800 rounded-lg w-11/12 md:max-w-2xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-white">Sale Details</h2>
            <p className="mb-2"><strong>Date:</strong> {saleDate(selectedSale)}</p>
            <p className="mb-2"><strong>Customer:</strong> {selectedSale.customerName || 'N/A'}</p>
            <p className="mb-2"><strong>Phone:</strong> {selectedSale.customerPhone || 'N/A'}</p>
            {selectedSale.customerIdNumber && <p className="mb-2"><strong>CNIC/ID:</strong> {selectedSale.customerIdNumber}</p>}
            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Unit Price</th>
                    <th className="p-2 text-left">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-700">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.qty}</td>
                      <td className="p-2">Rs. {item.salePrice?.toLocaleString()}</td>
                      <td className="p-2">Rs. {(item.salePrice * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4"><strong>Total:</strong> Rs. {selectedSale.totalAmount?.toLocaleString()}</p>
            <p className="mb-4"><strong>Profit:</strong> Rs. {selectedSale.totalProfit?.toLocaleString()}</p>
            <button
              onClick={handleDownloadPdf}
              className="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSale && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6 relative shadow-2xl">
            <button
              onClick={() => setEditingSale(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary-400" /> Edit Sale Details
            </h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Customer Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Customer Phone</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Customer CNIC / ID</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.customerIdNumber}
                  onChange={(e) => setEditForm({ ...editForm, customerIdNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Items & Prices</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {editForm.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="text-xs">
                        <p className="font-bold text-slate-300">{item.name}</p>
                        <p className="text-slate-500 font-mono">Qty: {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Rs.</span>
                        <input
                          type="number"
                          className="bg-slate-850 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white w-24 text-right"
                          value={item.salePrice}
                          onChange={(e) => handleItemPriceChange(index, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4 font-bold">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function saleDate(sale) {
  if (sale.soldAt?.seconds) {
    return new Date(sale.soldAt.seconds * 1000).toLocaleString('en-PK');
  }
  if (typeof sale.soldAt === 'string') {
    return new Date(sale.soldAt).toLocaleString('en-PK');
  }
  return '—';
}
