import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Barcode as BarcodeIcon, 
  Printer, 
  X, 
  Loader2,
  AlertTriangle,
  ChevronRight,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';

const CATEGORIES = [
  'Chargers',
  'Cables',
  'Headphones',
  'Cases/Covers',
  'Protectors',
  'Power Banks',
  'Smart Watches',
  'Batteries',
  'Other'
];

// Component for the printable barcode label
const BarcodeLabel = React.forwardRef(({ item }, ref) => {
  if (!item) return null;
  return (
    <div ref={ref} className="p-4 bg-white text-black flex flex-col items-center justify-center w-[200px]">
      <p className="text-[10px] font-bold mb-1 text-center uppercase tracking-tighter truncate w-full">
        {item.name}
      </p>
      <Barcode 
        value={item.barcode} 
        width={1.2} 
        height={50} 
        fontSize={10}
        margin={0}
      />
      <p className="text-[10px] font-bold mt-1">
        Rs. {item.sellingPrice.toLocaleString()}
      </p>
    </div>
  );
});

export default function Accessories() {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccessory, setCurrentAccessory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cables',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    minStock: '5'
  });
  const [submitting, setSubmitting] = useState(false);

  // Printing logic
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });
  const [itemToPrint, setItemToPrint] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'accessories'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccessories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setCurrentAccessory(item);
      setFormData({
        name: item.name,
        category: item.category,
        barcode: item.barcode,
        purchasePrice: item.purchasePrice.toString(),
        sellingPrice: item.sellingPrice.toString(),
        quantity: item.quantity.toString(),
        minStock: (item.minStock || 5).toString()
      });
    } else {
      setCurrentAccessory(null);
      setFormData({
        name: '',
        category: 'Cables',
        barcode: `ACC-${Date.now().toString().slice(-8)}`, // Auto-generate simple barcode
        purchasePrice: '',
        sellingPrice: '',
        quantity: '',
        minStock: '5'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        minStock: parseInt(formData.minStock),
        updatedAt: new Date().toISOString()
      };

      if (currentAccessory) {
        await updateDoc(doc(db, 'accessories', currentAccessory.id), data);
        toast.success("Accessory updated!");
      } else {
        await addDoc(collection(db, 'accessories'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        toast.success("Accessory added!");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save accessory");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this accessory?")) {
      try {
        await deleteDoc(doc(db, 'accessories', id));
        toast.success("Deleted successfully");
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  const filteredItems = accessories.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-400" />
            Accessory Inventory
          </h1>
          <p className="text-slate-400 text-sm">Manage chargers, cases, and other shop items.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Accessory
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            className="input-field pl-10 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter className="w-4 h-4 text-slate-500" />
           <select 
             className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 px-3 py-2 outline-none"
             value={categoryFilter}
             onChange={(e) => setCategoryFilter(e.target.value)}
           >
             <option value="all">All Categories</option>
             {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
           </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Barcode</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 italic">No accessories found.</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{item.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold uppercase border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        {item.barcode}
                        <button 
                          onClick={() => { setItemToPrint(item); setTimeout(handlePrint, 100); }}
                          className="p-1 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${item.quantity <= (item.minStock || 5) ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.quantity}
                        </span>
                        {item.quantity <= (item.minStock || 5) && (
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">Rs. {item.sellingPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg bg-slate-900 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">{currentAccessory ? 'Edit Accessory' : 'New Accessory'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Item Name *</label>
                  <input type="text" required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. iPhone 15 Pro Max Cover" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                  <select className="input-field py-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Barcode / SKU</label>
                  <div className="relative">
                    <input type="text" required className="input-field" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                    <BarcodeIcon className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Cost Price *</label>
                  <input type="number" required className="input-field" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Selling Price *</label>
                  <input type="number" required className="input-field" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Stock Quantity *</label>
                  <input type="number" required className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Min Stock Alert</label>
                  <input type="number" required className="input-field" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 py-3">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> {currentAccessory ? 'Update' : 'Add Item'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      <div className="hidden">
        <BarcodeLabel ref={printRef} item={itemToPrint} />
      </div>
    </div>
  );
}
