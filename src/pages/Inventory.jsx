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
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  'Available': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Sold': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Faulty': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Reserved': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function Inventory() {
  const [mobiles, setMobiles] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedMobile, setSelectedMobile] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // Real-time Suppliers for mapping
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const map = {};
      snapshot.forEach(doc => { map[doc.id] = doc.data().name; });
      setSuppliers(map);
    });

    // Real-time Mobiles
    const q = query(collection(db, 'mobiles'), orderBy('createdAt', 'desc'));
    const unsubMobiles = onSnapshot(q, (snapshot) => {
      setMobiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubSuppliers();
      unsubMobiles();
    };
  }, []);

  const updateStatus = async (mobileId, newStatus) => {
    try {
      await updateDoc(doc(db, 'mobiles', mobileId), { status: newStatus });
      toast.success(`Status updated!`);
      setIsDetailModalOpen(false);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const filteredMobiles = mobiles.filter(m => {
    const matchesSearch = 
      (m.imei1 && m.imei1.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.imei2 && m.imei2.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.imei && m.imei.toLowerCase().includes(searchQuery.toLowerCase())) || // backward compatibility
      m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-400" /> Inventory Stock
          </h1>
          <p className="text-slate-400 text-sm">Real-time view of all devices.</p>
        </div>
        <Link to="/add-mobile" className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Stock
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search IMEI, Brand, or Model..."
            className="input-field pl-10 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 px-3 py-2 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Available">Available</option>
          <option value="Sold">Sold</option>
          <option value="Faulty">Faulty</option>
          <option value="Reserved">Reserved</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Device</th>
                <th className="px-6 py-4 font-medium">IMEI</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Supplier</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /></td></tr>
              ) : filteredMobiles.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No stock found matching criteria.</td></tr>
              ) : (
                filteredMobiles.map((mobile) => (
                  <tr key={mobile.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{mobile.brand} {mobile.model}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-tight">{mobile.ramStorage} · {mobile.color}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span>{mobile.imei1 || mobile.imei}</span>
                        {mobile.imei2 && <span className="text-[10px] opacity-60">SIM2: {mobile.imei2}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">Rs. {mobile.sellingPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{suppliers[mobile.supplierId] || '...'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[mobile.status] || STATUS_COLORS['Available']}`}>
                        {mobile.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setSelectedMobile(mobile); setIsDetailModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary-400"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailModalOpen && selectedMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg bg-slate-900">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">{selectedMobile.brand} {selectedMobile.model}</h3>
              <button onClick={() => setIsDetailModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">IMEI 1</p>
                  <p className="text-white font-mono">{selectedMobile.imei1 || selectedMobile.imei}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">IMEI 2</p>
                  <p className="text-white font-mono">{selectedMobile.imei2 || '-'}</p>
                </div>
                <div><p className="text-slate-500 text-xs font-bold uppercase mb-1">Color</p><p className="text-white">{selectedMobile.color}</p></div>
                <div><p className="text-slate-500 text-xs font-bold uppercase mb-1">Cost Price</p><p className="text-white font-medium">Rs. {selectedMobile.purchasePrice.toLocaleString()}</p></div>
                <div><p className="text-slate-500 text-xs font-bold uppercase mb-1">Selling Price</p><p className="text-primary-400 font-bold">Rs. {selectedMobile.sellingPrice.toLocaleString()}</p></div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs font-bold uppercase mb-3">Update Status</p>
                <div className="flex gap-2">
                  {['Available', 'Faulty', 'Reserved'].map(st => (
                    <button key={st} onClick={() => updateStatus(selectedMobile.id, st)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedMobile.status === st ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{st}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
