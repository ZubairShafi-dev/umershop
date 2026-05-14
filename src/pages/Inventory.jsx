import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { 
  Smartphone, 
  Search, 
  Tag, 
  Edit2,
  Eye,
  Package,
  Loader2,
  X,
  Plus,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  'Available': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Sold': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Faulty': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Reserved': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function Inventory() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [mobiles, setMobiles] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, mobile, accessory
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // Real-time Suppliers
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const map = {};
      snapshot.forEach(doc => { map[doc.id] = doc.data().name; });
      setSuppliers(map);
    });

    // Real-time Mobiles
    const qMobiles = query(collection(db, 'mobiles'), orderBy('createdAt', 'desc'));
    const unsubMobiles = onSnapshot(qMobiles, (snapshot) => {
      setMobiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'mobile' })));
    });

    // Real-time Accessories
    const qAccessories = query(collection(db, 'accessories'), orderBy('updatedAt', 'desc'));
    const unsubAccessories = onSnapshot(qAccessories, (snapshot) => {
      setAccessories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'accessory' })));
      setLoading(false);
    });

    return () => {
      unsubSuppliers();
      unsubMobiles();
      unsubAccessories();
    };
  }, []);

  const updateStatus = async (itemId, newStatus, itemType) => {
    try {
      if (itemType === 'mobile') {
        await updateDoc(doc(db, 'mobiles', itemId), { status: newStatus });
      }
      toast.success(`Status updated!`);
      setIsDetailModalOpen(false);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const filteredItems = (() => {
    let combined = [];
    if (typeFilter === 'all' || typeFilter === 'mobile') combined = [...combined, ...mobiles];
    if (typeFilter === 'all' || typeFilter === 'accessory') combined = [...combined, ...accessories];

    return combined.filter(item => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = item.type === 'mobile' 
        ? (item.brand.toLowerCase().includes(search) || item.model.toLowerCase().includes(search) || (item.imei1 || item.imei).includes(search))
        : (item.name.toLowerCase().includes(search) || item.barcode.includes(search));
      
      const matchesStatus = statusFilter === 'all' || (item.type === 'mobile' && item.status === statusFilter) || (item.type === 'accessory' && statusFilter === 'all');
      
      return matchesSearch && matchesStatus;
    });
  })();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-400" /> Unified Inventory
          </h1>
          <p className="text-slate-400 text-sm">Full view of mobiles and accessories stock.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/add-mobile" className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm border-slate-700 bg-slate-800 text-slate-300">
            <Smartphone className="w-4 h-4" /> Add Mobile
          </Link>
          <Link to="/accessories" className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Accessory
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Search Inventory</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search IMEI, Name, Brand, or Barcode..."
              className="input-field pl-10 py-2.5 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Filter className="w-3 h-3" /> Category</label>
          <select 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="mobile">Mobile Devices</option>
            <option value="accessory">Accessories</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Status</label>
          <select 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Any Status</option>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Faulty">Faulty</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Item Details</th>
                <th className="px-6 py-4 font-medium">Identifier (IMEI/Barcode)</th>
                <th className="px-6 py-4 font-medium text-right">Selling Price</th>
                <th className="px-6 py-4 font-medium text-center">Stock / Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic font-medium">No items found matching filters.</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.type === 'mobile' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-primary-500/10 text-primary-400'}`}>
                           {item.type === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{item.type === 'mobile' ? `${item.brand} ${item.model}` : item.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-tight">{item.type === 'mobile' ? `${item.ramStorage} · ${item.color}` : item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                      {item.type === 'mobile' ? (
                        <div className="flex flex-col gap-0.5">
                          <span>{item.imei1 || item.imei}</span>
                          {item.imei2 && <span className="text-[10px] opacity-60">SIM2: {item.imei2}</span>}
                        </div>
                      ) : (
                        <span>{item.barcode}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-white font-bold">Rs. {item.sellingPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      {item.type === 'mobile' ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${STATUS_COLORS[item.status] || STATUS_COLORS['Available']}`}>
                          {item.status}
                        </span>
                      ) : (
                        <div className="flex flex-col items-center">
                           <span className={`text-xs font-bold ${item.quantity <= 5 ? 'text-rose-400' : 'text-emerald-400'}`}>{item.quantity} In Stock</span>
                           {item.quantity <= 5 && <span className="text-[8px] text-rose-500 uppercase font-black">Low Stock</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setSelectedItem(item); setIsDetailModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary-400 hover:bg-slate-800 rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">{selectedItem.type === 'mobile' ? `${selectedItem.brand} ${selectedItem.model}` : selectedItem.name}</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                {selectedItem.type === 'mobile' ? (
                  <>
                    <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">IMEI 1</p><p className="text-white font-mono text-xs">{selectedItem.imei1 || selectedItem.imei}</p></div>
                      <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">IMEI 2</p><p className="text-white font-mono text-xs">{selectedItem.imei2 || '-'}</p></div>
                    </div>
                    <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Color</p><p className="text-white">{selectedItem.color}</p></div>
                    <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Supplier</p><p className="text-white text-xs">{suppliers[selectedItem.supplierId] || 'Direct'}</p></div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Barcode</p>
                      <p className="text-white font-mono">{selectedItem.barcode}</p>
                    </div>
                    <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Quantity</p><p className={`text-xl font-bold ${selectedItem.quantity <= 5 ? 'text-rose-400' : 'text-white'}`}>{selectedItem.quantity}</p></div>
                    <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Category</p><p className="text-white">{selectedItem.category}</p></div>
                  </>
                )}
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Cost Price</p>
                  <p className="text-slate-300">{isAdmin ? `Rs. ${selectedItem.purchasePrice.toLocaleString()}` : '***'}</p>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-primary-500 text-[10px] font-bold uppercase mb-1">Selling Price</p>
                  <p className="text-xl font-black text-white">Rs. {selectedItem.sellingPrice.toLocaleString()}</p>
                </div>
              </div>

              {selectedItem.type === 'mobile' && (
                <div className="pt-6 border-t border-slate-800">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-3 flex items-center gap-1"><Monitor className="w-3 h-3" /> Update Stock Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Available', 'Faulty', 'Reserved'].map(st => (
                      <button 
                        key={st} 
                        onClick={() => updateStatus(selectedItem.id, st, 'mobile')} 
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${selectedItem.status === st ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-800/20 border-t border-slate-800 flex justify-end">
               <button onClick={() => setIsDetailModalOpen(false)} className="btn-secondary px-6 py-2 text-xs font-bold">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
