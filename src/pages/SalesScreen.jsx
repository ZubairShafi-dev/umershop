import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { 
  ShoppingCart, 
  Scan, 
  Smartphone, 
  User, 
  Phone, 
  DollarSign, 
  CheckCircle2, 
  Loader2,
  X,
  AlertCircle,
  Tag,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SalesScreen() {
  const { currentUser } = useAuth();
  const [imei, setImei] = useState('');
  const [searching, setSearching] = useState(false);
  const [device, setDevice] = useState(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [finalPrice, setFinalPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!imei.trim()) return;

    try {
      setSearching(true);
      setDevice(null);
      setSaleComplete(false);

      const q = query(
        collection(db, 'mobiles'), 
        where('imei', '==', imei.trim()),
        where('status', '==', 'in_stock')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const deviceData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        setDevice(deviceData);
        setFinalPrice(deviceData.sellingPrice.toString());
        toast.success("Device ready for sale!");
      } else {
        // Check if device exists but is already sold
        const qExists = query(collection(db, 'mobiles'), where('imei', '==', imei.trim()));
        const existsSnap = await getDocs(qExists);
        if (!existsSnap.empty) {
          toast.error(`Device is currently ${existsSnap.docs[0].data().status.replace('_', ' ')}`);
        } else {
          toast.error("Device not found in inventory");
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error fetching device");
    } finally {
      setSearching(false);
    }
  };

  const processSale = async () => {
    if (!device) return;
    
    try {
      setSubmitting(true);
      const salePriceNum = parseFloat(finalPrice);
      const profit = salePriceNum - device.purchasePrice;

      // 1. Record Sale
      await addDoc(collection(db, 'sales'), {
        imei: device.imei,
        brand: device.brand,
        model: device.model,
        purchasePrice: device.purchasePrice,
        salePrice: salePriceNum,
        profit: profit,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        soldBy: currentUser.email,
        soldAt: new Date().toISOString()
      });

      // 2. Update Inventory Status
      await updateDoc(doc(db, 'mobiles', device.id), {
        status: 'sold',
        updatedAt: new Date().toISOString()
      });

      toast.success("Sale completed successfully!");
      setSaleComplete(true);
      
      // Auto reset after success
      setTimeout(() => {
        resetScreen();
      }, 3000);
    } catch (error) {
      console.error("Sale processing error:", error);
      toast.error("Failed to complete sale");
    } finally {
      setSubmitting(false);
    }
  };

  const resetScreen = () => {
    setDevice(null);
    setImei('');
    setCustomerInfo({ name: '', phone: '' });
    setFinalPrice('');
    setSaleComplete(false);
    if (inputRef.current) inputRef.current.focus();
  };

  if (saleComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Sale Completed!</h2>
          <p className="text-slate-400">Inventory updated and sale recorded in history.</p>
        </div>
        <button 
          onClick={resetScreen}
          className="btn-primary px-8 py-3 flex items-center gap-2"
        >
          New Sale Transaction
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary-400" />
            Point of Sale
          </h1>
          <p className="text-slate-400 text-sm">Process device sales and generate records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Scan Device */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 border-primary-500/20 bg-primary-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Scan className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-bold text-white">Scan Device IMEI</h2>
            </div>
            
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Scan IMEI to start sale..."
                className="input-field pl-12 text-xl font-mono tracking-widest py-4 bg-slate-900"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                disabled={!!device}
              />
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
              {device && (
                <button 
                  onClick={resetScreen}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-700 hover:bg-slate-600 rounded-full text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>

          {device && (
            <div className="card p-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-start justify-between border-b border-slate-800 pb-6 mb-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Smartphone className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{device.brand} {device.model}</h3>
                    <p className="text-sm text-slate-400">{device.ramStorage} · {device.color}</p>
                    <p className="text-xs text-primary-500 font-mono mt-1">{device.imei}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Standard Price</p>
                  <p className="text-2xl font-bold text-white">Rs. {device.sellingPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    Customer Details (Optional)
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      className="input-field py-2.5"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    />
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        className="input-field py-2.5 pl-10"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      />
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-500" />
                    Final Sale Pricing
                  </h4>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Final Selling Price"
                        className="input-field py-2.5 pl-12 text-lg font-bold text-primary-400 border-primary-500/30"
                        value={finalPrice}
                        onChange={(e) => setFinalPrice(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold">Rs.</span>
                      </div>
                    </div>
                    {finalPrice && parseFloat(finalPrice) < device.purchasePrice && (
                      <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                        <AlertCircle className="w-3 h-3" />
                        Warning: Selling price is below cost (Rs. {device.purchasePrice})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="card p-6 bg-slate-900 border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-400" />
              Sale Summary
            </h3>
            
            {!device ? (
              <div className="text-center py-10 opacity-50">
                <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-sm text-slate-500">Scan a device to view summary</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Device Model</span>
                    <span className="text-slate-200 font-medium">{device.model}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Purchase Price</span>
                    <span className="text-slate-500">Rs. {device.purchasePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Final Price</span>
                    <span className="text-white font-bold">Rs. {parseFloat(finalPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estimated Profit</span>
                    <span className={`text-lg font-bold ${parseFloat(finalPrice) - device.purchasePrice >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Rs. {(parseFloat(finalPrice || 0) - device.purchasePrice).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mb-4">
                    Transaction by {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                  </p>
                  <button 
                    onClick={processSale}
                    disabled={submitting || !finalPrice}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-lg"
                  >
                    {submitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Complete Sale
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <p className="text-xs text-amber-500 leading-relaxed">
              <strong>Notice:</strong> Completing this sale will permanently update the inventory status of IMEI {device?.imei || '...'} to 'Sold'.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
