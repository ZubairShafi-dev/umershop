import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Search, 
  Smartphone, 
  Scan, 
  ArrowRight, 
  Info,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  Tag,
  History,
  TrendingUp,
  MapPin,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  'in_stock': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'sold': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'reserved': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'faulty': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'returned': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

export default function IMEISearch() {
  const [imei, setImei] = useState('');
  const [device, setDevice] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!imei.trim()) return;

    try {
      setSearching(true);
      setHasSearched(true);
      setDevice(null);
      setSupplier(null);

      const q = query(collection(db, 'mobiles'), where('imei', '==', imei.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const deviceData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        setDevice(deviceData);

        // Fetch supplier details
        if (deviceData.supplierId) {
          const supplierSnap = await getDocs(query(collection(db, 'suppliers')));
          const sup = supplierSnap.docs.find(d => d.id === deviceData.supplierId);
          if (sup) setSupplier(sup.data());
        }
        toast.success("Device found!");
      } else {
        toast.error("No device found with this IMEI");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error searching for device");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setImei('');
    setDevice(null);
    setSupplier(null);
    setHasSearched(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">IMEI Quick Search</h1>
        <p className="text-slate-400">Scan any device barcode to instantly view its history and details.</p>
      </div>

      {/* Search Input Section */}
      <div className="card p-8 border-primary-500/20 bg-primary-500/5 shadow-2xl shadow-primary-500/10">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Scan or type IMEI number..."
              className="w-full bg-slate-900/50 border-2 border-slate-700 focus:border-primary-500 rounded-2xl px-16 py-6 text-2xl font-mono tracking-[0.2em] text-white placeholder:text-slate-600 outline-none transition-all"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Scan className="h-8 w-8 text-primary-500/50" />
            </div>
            {imei && (
              <button 
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-20 pr-4 flex items-center text-slate-500 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            )}
            <button 
              type="submit"
              disabled={searching || !imei}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-600 p-4 rounded-xl text-white transition-all shadow-lg"
            >
              {searching ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              Scanner Ready
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-2">
              Auto-focus Active
            </div>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {hasSearched && !searching && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {device ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Device Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card p-8 bg-slate-900/40">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                        <Smartphone className="w-10 h-10 text-primary-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{device.brand} {device.model}</h2>
                        <p className="text-slate-500 font-mono tracking-tighter">{device.ramStorage} · {device.color}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${STATUS_COLORS[device.status]}`}>
                      {device.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Warranty Status</p>
                      <p className="text-white font-medium flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary-400" />
                        {device.warranty}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Purchase Date</p>
                      <p className="text-white font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-400" />
                        {new Date(device.purchaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {device.notes && (
                    <div className="mt-8 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Staff Notes
                      </p>
                      <p className="text-sm text-slate-400 italic">"{device.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Profit/Pricing Card (Admin/Salesman relevant) */}
                <div className="card p-8 bg-emerald-500/5 border-emerald-500/10">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">Pricing & Profit Analysis</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Purchase Cost</p>
                      <p className="text-xl font-bold text-slate-400">Rs. {device.purchasePrice.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20">
                      <p className="text-[10px] font-bold text-primary-500 uppercase mb-1">Selling Price</p>
                      <p className="text-2xl font-bold text-white">Rs. {device.sellingPrice.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Net Profit</p>
                      <p className="text-2xl font-bold text-emerald-400">Rs. {(device.sellingPrice - device.purchasePrice).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Supplier Info */}
                <div className="card p-6 border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-white">Supplier Info</h3>
                  </div>
                  {supplier ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Shop Name</p>
                        <p className="text-white font-medium">{supplier.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Contact</p>
                        <p className="text-slate-400 text-sm">{supplier.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Address</p>
                        <p className="text-slate-400 text-sm flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-1 shrink-0" />
                          {supplier.address}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No supplier data found</p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <button className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg shadow-xl shadow-primary-600/20">
                    <Tag className="w-5 h-5" />
                    Sell This Device
                  </button>
                  <button className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
                    <History className="w-4 h-4" />
                    View Device Log
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center bg-rose-500/5 border-rose-500/10">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-10 h-10 text-rose-500/30" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Device Not Found</h3>
              <p className="text-slate-400 max-w-md mx-auto">We couldn't find any device with IMEI <span className="text-white font-mono">{imei}</span> in the system.</p>
              <button 
                onClick={clearSearch}
                className="mt-8 btn-secondary px-8 py-3"
              >
                Try Another IMEI
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
