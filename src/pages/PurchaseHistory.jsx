import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generatePurchasePdf } from '../utils/pdfGenerator.js?v=3';
import { X, FileDown, Package, Edit, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

function formatTs(ts) {
  if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
  if (ts?.toDate) return ts.toDate().toLocaleString();
  // Handle ISO string from Suppliers (createdAt stored as string in some docs)
  if (typeof ts === 'string') return new Date(ts).toLocaleString();
  return '—';
}

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [supplierMap, setSupplierMap] = useState({}); // { supplierId: supplierName }
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editForm, setEditForm] = useState({
    brand: '',
    model: '',
    imei1: '',
    imei2: '',
    storage: '',
    color: '',
    supplierId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    status: 'Available'
  });

  // Fetch suppliers once to build lookup map
  useEffect(() => {
    getDocs(collection(db, 'suppliers')).then((snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = d.data().name || d.id;
      });
      setSupplierMap(map);
    });
  }, []);

  // Real-time listener on mobiles
  useEffect(() => {
    const q = query(collection(db, 'mobiles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPurchases(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getSupplierName = (item) =>
    supplierMap[item.supplierId] || item.supplierName || item.supplierId || '—';

  const openModal = (purchase) => setSelectedPurchase(purchase);
  const closeModal = () => setSelectedPurchase(null);

  const handleDownloadPdf = () => {
    if (!selectedPurchase) return;
    const purchaseObj = {
      id: selectedPurchase.id,
      supplierName: getSupplierName(selectedPurchase),
      purchasedAt: selectedPurchase.createdAt,
      totalCost: selectedPurchase.purchasePrice,
      items: [{
        name: `${selectedPurchase.brand} ${selectedPurchase.model}`,
        qty: 1,
        purchasePrice: selectedPurchase.purchasePrice,
      }],
    };
    generatePurchasePdf(purchaseObj);
  };

  const handleDeletePurchase = async (item) => {
    if (!window.confirm(`Are you sure you want to delete the purchase record of ${item.brand} ${item.model}? This will remove it from inventory.`)) return;
    try {
      await deleteDoc(doc(db, 'mobiles', item.id));
      toast.success("Purchase record and mobile device deleted from inventory!");
    } catch (error) {
      console.error("Error deleting purchase:", error);
      toast.error("Failed to delete purchase: " + error.message);
    }
  };

  const startEdit = (item) => {
    setEditingPurchase(item);
    setEditForm({
      brand: item.brand || '',
      model: item.model || '',
      imei1: item.imei1 || '',
      imei2: item.imei2 || '',
      storage: item.storage || '',
      color: item.color || '',
      supplierId: item.supplierId || '',
      purchasePrice: item.purchasePrice || 0,
      sellingPrice: item.sellingPrice || 0,
      status: item.status || 'Available'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const mobileRef = doc(db, 'mobiles', editingPurchase.id);
      await updateDoc(mobileRef, {
        brand: editForm.brand,
        model: editForm.model,
        imei1: editForm.imei1,
        imei2: editForm.imei2,
        storage: editForm.storage,
        color: editForm.color,
        supplierId: editForm.supplierId,
        purchasePrice: parseFloat(editForm.purchasePrice) || 0,
        sellingPrice: parseFloat(editForm.sellingPrice) || 0,
        status: editForm.status,
        updatedAt: new Date().toISOString()
      });
      toast.success("Purchase and mobile details updated successfully!");
      setEditingPurchase(null);
    } catch (error) {
      console.error("Error updating purchase:", error);
      toast.error("Failed to update purchase.");
    }
  };

  return (
    <div className="p-6 min-h-screen text-slate-100 font-sans" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Package className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Purchase History</h1>
          <p className="text-sm text-slate-400">{purchases.length} items purchased</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading…</div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-xl" style={{ background: '#1e293b' }}>
          <table className="w-full text-sm">
            <thead style={{ background: '#0f172a' }}>
              <tr className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Date Purchased</th>
                <th className="px-4 py-3 text-left">Brand / Model</th>
                <th className="px-4 py-3 text-left">IMEI</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Cost</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-700/40 hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => openModal(item)}
                >
                  <td className="px-4 py-3 text-slate-300">{formatTs(item.createdAt)}</td>
                  <td className="px-4 py-3 text-white font-medium">{item.brand} {item.model}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.imei1 || '—'}</td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{getSupplierName(item)}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">
                    Rs. {item.purchasePrice?.toLocaleString() ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      item.status?.toLowerCase() === 'available'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : item.status?.toLowerCase() === 'sold'
                        ? 'bg-slate-500/20 text-slate-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {item.status || 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 hover:bg-slate-700 rounded-lg text-primary-400 inline-flex items-center transition-colors"
                      title="Edit Purchase"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePurchase(item)}
                      className="p-1.5 hover:bg-slate-700 rounded-lg text-rose-400 inline-flex items-center transition-colors"
                      title="Delete Purchase"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 && (
            <div className="text-slate-500 text-center py-16">No purchases found.</div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="rounded-2xl border border-slate-700 w-full max-w-xl p-6 relative shadow-2xl" style={{ background: '#1e293b' }}>
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Package className="w-4 h-4 text-violet-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Purchase Detail</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              {[
                ['Brand', selectedPurchase.brand],
                ['Model', selectedPurchase.model],
                ['IMEI 1', selectedPurchase.imei1 || '—'],
                ['IMEI 2', selectedPurchase.imei2 || '—'],
                ['Storage', selectedPurchase.storage || '—'],
                ['Color', selectedPurchase.color || '—'],
                ['Supplier', getSupplierName(selectedPurchase)],
                ['Purchase Date', formatTs(selectedPurchase.createdAt)],
                ['Purchase Cost', `Rs. ${selectedPurchase.purchasePrice?.toLocaleString() ?? '—'}`],
                ['Selling Price', `Rs. ${selectedPurchase.sellingPrice?.toLocaleString() ?? '—'}`],
                ['Status', selectedPurchase.status || '—'],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-white font-medium">{value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleDownloadPdf}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff' }}
            >
              <FileDown className="w-4 h-4" />
              Download PDF Invoice
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl p-6 relative shadow-2xl">
            <button
              onClick={() => setEditingPurchase(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary-400" /> Edit Purchase details
            </h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Brand</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Model</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">IMEI 1</label>
                  <input
                    type="text"
                    className="input-field font-mono"
                    value={editForm.imei1}
                    onChange={(e) => setEditForm({ ...editForm, imei1: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">IMEI 2 (Optional)</label>
                  <input
                    type="text"
                    className="input-field font-mono"
                    value={editForm.imei2}
                    onChange={(e) => setEditForm({ ...editForm, imei2: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Storage</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.storage}
                    onChange={(e) => setEditForm({ ...editForm, storage: e.target.value })}
                    placeholder="e.g. 128GB / 256GB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Color</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Supplier</label>
                  <select
                    className="input-field"
                    value={editForm.supplierId}
                    onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value })}
                  >
                    <option value="">Select Supplier</option>
                    {Object.entries(supplierMap).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    className="input-field"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Sold">Sold</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Purchase Cost (Rs.)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editForm.purchasePrice}
                    onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Selling Price (Rs.)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                    required
                  />
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
