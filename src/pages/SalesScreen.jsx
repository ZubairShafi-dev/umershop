import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, or, runTransaction } from 'firebase/firestore';
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
  Receipt,
  Package,
  Plus,
  Minus,
  Search,
  Trash2,
  Barcode as BarcodeIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SalesScreen() {
  const { currentUser } = useAuth();
  const [scanValue, setScanValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]);
  
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  
  // Manual Search for Accessories
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingAccessories, setSearchingAccessories] = useState(false);

  const inputRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    
    // Auto-scan if coming from IMEI Search
    if (location.state?.scanCode) {
      setScanValue(location.state.scanCode);
      // We need a small delay to ensure state is set before searching
      setTimeout(() => {
        handleSearch(null, location.state.scanCode);
      }, 100);
    }
  }, [location.state]);

  const handleSearch = async (e, forceVal = null) => {
    if (e) e.preventDefault();
    const val = forceVal || scanValue.trim();
    if (!val) return;

    try {
      setSearching(true);
      
      // 1. Try finding in Mobiles (IMEI)
      const qMobile = query(
        collection(db, 'mobiles'), 
        or(
          where('imei1', '==', val),
          where('imei2', '==', val),
          where('imei', '==', val)
        )
      );
      const mobileSnap = await getDocs(qMobile);

      if (!mobileSnap.empty) {
        const mobileDoc = mobileSnap.docs[0];
        const data = { id: mobileDoc.id, ...mobileDoc.data(), type: 'mobile' };
        
        if (data.status !== 'Available') {
          toast.error(`Device is already ${data.status}`);
          setSearching(false);
          return;
        }

        // Check if already in cart
        if (cart.find(item => item.id === data.id)) {
          toast.error("Mobile already in cart");
        } else {
          setCart([...cart, { ...data, salePrice: data.sellingPrice, qty: 1 }]);
          toast.success("Mobile added to cart");
          setScanValue('');
        }
        return;
      }

      // 2. Try finding in Accessories (Barcode)
      const qAccessory = query(collection(db, 'accessories'), where('barcode', '==', val));
      const accessorySnap = await getDocs(qAccessory);

      if (!accessorySnap.empty) {
        const data = { id: accessorySnap.docs[0].id, ...accessorySnap.docs[0].data(), type: 'accessory' };
        if (data.quantity <= 0) {
           toast.error("Item out of stock");
           return;
        }
        addItemToCart(data);
        setScanValue('');
        return;
      }

      toast.error("No item found with this code");
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error searching item");
    } finally {
      setSearching(false);
    }
  };

  const addItemToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      if (item.type === 'accessory' && existing.qty >= item.quantity) {
        toast.error("Cannot add more than available stock");
        return;
      }
      setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...item, salePrice: item.sellingPrice, qty: 1 }]);
    }
    toast.success(`${item.name || item.model} added`);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return item;
        if (item.type === 'accessory' && newQty > item.quantity) {
          toast.error("Stock limit reached");
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const updateCartPrice = (id, newPrice) => {
    setCart(cart.map(item => item.id === id ? { ...item, salePrice: parseFloat(newPrice) || 0 } : item));
  };

  const handleManualSearch = async () => {
    if (!manualSearchQuery.trim()) return;
    try {
      setSearchingAccessories(true);
      const q = query(collection(db, 'accessories'), orderBy('name'));
      const snap = await getDocs(q);
      const results = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.name.toLowerCase().includes(manualSearchQuery.toLowerCase()));
      setSearchResults(results);
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setSearchingAccessories(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.salePrice * item.qty), 0);
  const totalProfit = cart.reduce((sum, item) => sum + ((item.salePrice - item.purchasePrice) * item.qty), 0);

  const processSale = async () => {
    if (cart.length === 0) return;
    
    try {
      setSubmitting(true);
      
      await runTransaction(db, async (transaction) => {
        // 1. Prepare Sale Record
        const saleRef = collection(db, 'sales');
        const saleData = {
          items: cart.map(item => ({
            id: item.id,
            name: item.name || `${item.brand} ${item.model}`,
            type: item.type,
            qty: item.qty,
            salePrice: item.salePrice,
            purchasePrice: item.purchasePrice,
            profit: (item.salePrice - item.purchasePrice) * item.qty,
            imei: item.type === 'mobile' ? (item.imei1 || item.imei) : null
          })),
          totalAmount,
          totalProfit,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          soldBy: currentUser.email,
          soldAt: new Date().toISOString()
        };

        // 2. Update Inventories
        for (const item of cart) {
          if (item.type === 'mobile') {
            const mobileRef = doc(db, 'mobiles', item.id);
            transaction.update(mobileRef, { status: 'Sold', updatedAt: new Date().toISOString() });
          } else {
            const accRef = doc(db, 'accessories', item.id);
            transaction.update(accRef, { 
              quantity: item.quantity - item.qty,
              updatedAt: new Date().toISOString()
            });
          }
        }

        // 3. Save Sale
        await addDoc(saleRef, saleData);
      });

      toast.success("Sale completed successfully!");
      setSaleComplete(true);
      setTimeout(() => resetScreen(), 3000);
    } catch (error) {
      console.error("Sale error:", error);
      toast.error("Transaction failed: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetScreen = () => {
    setCart([]);
    setScanValue('');
    setCustomerInfo({ name: '', phone: '' });
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
          <p className="text-slate-400">Inventory updated and sale recorded.</p>
        </div>
        <button onClick={resetScreen} className="btn-primary px-8 py-3 flex items-center gap-2">New Sale Transaction <ArrowRight className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary-400" />
            Point of Sale
          </h1>
          <p className="text-slate-400 text-sm">Unified billing for mobiles and accessories.</p>
        </div>
        <button 
          onClick={() => setIsSearchModalOpen(true)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Search className="w-4 h-4" /> Manual Search
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Scanner Input */}
          <div className="card p-6 border-primary-500/20 bg-primary-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Scan className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-bold text-white">Scan IMEI or Barcode</h2>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Scan item code to add to cart..."
                className="input-field pl-12 text-xl font-mono tracking-widest py-4 bg-slate-900"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
              />
              <BarcodeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              )}
            </form>
          </div>

          {/* Cart Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Cart Items ({cart.length})</h3>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-rose-400 hover:underline">Clear All</button>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 text-[10px] uppercase tracking-widest">
                    <th className="px-6 py-4 font-medium">Item</th>
                    <th className="px-6 py-4 font-medium">Qty</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Subtotal</th>
                    <th className="px-6 py-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cart.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">Cart is empty. Scan an item to start.</td></tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.type === 'mobile' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-primary-500/10 text-primary-400'}`}>
                               {item.type === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{item.name || `${item.brand} ${item.model}`}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{item.barcode || item.imei1 || item.imei}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           {item.type === 'accessory' ? (
                             <div className="flex items-center gap-3">
                               <button onClick={() => updateCartQty(item.id, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700"><Minus className="w-3 h-3" /></button>
                               <span className="text-sm font-bold text-white w-4 text-center">{item.qty}</span>
                               <button onClick={() => updateCartQty(item.id, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700"><Plus className="w-3 h-3" /></button>
                             </div>
                           ) : <span className="text-sm text-slate-400 font-medium">1 Unit</span>}
                        </td>
                        <td className="px-6 py-4">
                           <div className="relative max-w-[120px]">
                             <span className="absolute left-2 top-2 text-[10px] text-slate-500">Rs.</span>
                             <input 
                               type="number" 
                               className="bg-slate-900/50 border border-slate-700 rounded px-6 py-1.5 text-sm font-bold text-white w-full"
                               value={item.salePrice}
                               onChange={(e) => updateCartPrice(item.id, e.target.value)}
                             />
                           </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-white">Rs. {(item.salePrice * item.qty).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="card p-6 bg-slate-900 border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Receipt className="w-5 h-5 text-slate-400" /> Sale Summary</h3>
            
            <div className="space-y-4">
              <div className="space-y-3">
                 <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="text-slate-200 font-medium">Rs. {totalAmount.toLocaleString()}</span></div>
                 <div className="flex justify-between text-sm"><span className="text-slate-500">Discount</span><span className="text-slate-200">Rs. 0</span></div>
                 <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-2xl font-black text-primary-400">Rs. {totalAmount.toLocaleString()}</span>
                 </div>
              </div>

              <div className="pt-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer Details</h4>
                  <input type="text" placeholder="Customer Name" className="input-field py-2 text-sm" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                  <input type="tel" placeholder="Phone Number" className="input-field py-2 text-sm" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                </div>
                
                <button 
                  onClick={processSale} 
                  disabled={submitting || cart.length === 0} 
                  className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-lg font-bold mt-4"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Complete Sale <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-2xl bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Search className="w-5 h-5 text-primary-400" /> Search Accessories</h3>
              <button onClick={() => setIsSearchModalOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type accessory name..." 
                  className="input-field flex-1" 
                  value={manualSearchQuery}
                  onChange={e => setManualSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                />
                <button onClick={handleManualSearch} className="btn-primary px-6"><Search className="w-5 h-5" /></button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {searchingAccessories ? (
                  <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" /></div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 italic">Search by item name to see results.</div>
                ) : (
                  searchResults.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-primary-500/50 transition-colors group">
                       <div>
                         <p className="font-bold text-white">{item.name}</p>
                         <p className="text-xs text-slate-500">{item.category} · Stock: {item.quantity}</p>
                       </div>
                       <div className="flex items-center gap-4">
                         <p className="text-sm font-bold text-primary-400">Rs. {item.sellingPrice.toLocaleString()}</p>
                         <button 
                           onClick={() => { addItemToCart({ ...item, type: 'accessory' }); setIsSearchModalOpen(false); }}
                           disabled={item.quantity <= 0}
                           className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-600"
                         >
                           <Plus className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
