import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, arrayUnion, Timestamp } from 'firebase/firestore';
import { 
  Calendar, 
  Plus, 
  Search, 
  User, 
  Phone, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  ChevronRight,
  Smartphone,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Installments() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    itemDetails: '',
    totalAmount: '',
    downPayment: '',
    installmentAmount: '',
    durationMonths: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'installments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const total = parseFloat(formData.totalAmount);
      const down = parseFloat(formData.downPayment);
      
      await addDoc(collection(db, 'installments'), {
        ...formData,
        totalAmount: total,
        downPayment: down,
        remainingAmount: total - down,
        installmentAmount: parseFloat(formData.installmentAmount),
        durationMonths: parseInt(formData.durationMonths),
        status: 'Active',
        payments: [{
          amount: down,
          date: new Date().toISOString(),
          note: 'Down Payment'
        }],
        createdAt: new Date().toISOString()
      });
      
      toast.success("Installment plan created!");
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !payAmount) return;
    
    try {
      setLoading(true);
      const amount = parseFloat(payAmount);
      const newRemaining = selectedPlan.remainingAmount - amount;
      
      await updateDoc(doc(db, 'installments', selectedPlan.id), {
        remainingAmount: newRemaining,
        status: newRemaining <= 0 ? 'Completed' : 'Active',
        payments: arrayUnion({
          amount: amount,
          date: new Date().toISOString(),
          note: 'Installment Payment'
        })
      });
      
      toast.success("Payment recorded!");
      setIsPayModalOpen(false);
      setPayAmount('');
    } catch (error) {
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      itemDetails: '',
      totalAmount: '',
      downPayment: '',
      installmentAmount: '',
      durationMonths: '',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const filteredPlans = plans.filter(p => 
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customerPhone.includes(searchQuery) ||
    p.itemDetails.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-400" /> Installment Plans (Kist)
          </h1>
          <p className="text-slate-400 text-sm">Manage customer credit and monthly payments.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary py-2 px-6 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Kist Plan
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search customer or phone..."
          className="input-field pl-10 py-2 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary-500" /></div>
        ) : filteredPlans.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 italic">No installment plans found.</div>
        ) : (
          filteredPlans.map((plan) => (
            <div key={plan.id} className="card p-6 bg-slate-900/40 border-slate-800 hover:border-primary-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${plan.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {plan.status}
                </div>
                <button onClick={() => { setSelectedPlan(plan); setIsPayModalOpen(true); }} className="p-2 bg-primary-600/10 text-primary-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-600 hover:text-white">
                  <DollarSign className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary-400 font-bold">
                    {plan.customerName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{plan.customerName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {plan.customerPhone}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Item Details</p>
                  <p className="text-sm text-slate-300 flex items-center gap-2"><Smartphone className="w-3 h-3" /> {plan.itemDetails}</p>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-xs"><span className="text-slate-500">Total Amount</span><span className="text-white font-bold">Rs. {plan.totalAmount.toLocaleString()}</span></div>
                   <div className="flex justify-between text-xs"><span className="text-slate-500">Paid Amount</span><span className="text-emerald-400 font-bold">Rs. {(plan.totalAmount - plan.remainingAmount).toLocaleString()}</span></div>
                   <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Balance Due</span>
                      <span className="text-lg font-black text-rose-400">Rs. {plan.remainingAmount.toLocaleString()}</span>
                   </div>
                </div>

                <div className="pt-2">
                   <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${((plan.totalAmount - plan.remainingAmount) / plan.totalAmount) * 100}%` }}></div>
                   </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2">
                   <span>{plan.durationMonths} Months Plan</span>
                   <span className="text-primary-400">Rs. {plan.installmentAmount.toLocaleString()} / Month</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg bg-slate-900 overflow-hidden shadow-2xl border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-amber-400" /> Create Installment Plan</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Customer Name</label>
                  <input required type="text" className="input-field" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Phone Number</label>
                  <input required type="tel" className="input-field font-mono" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Item / Model</label>
                  <input required type="text" placeholder="e.g. iPhone 15 Pro Max" className="input-field" value={formData.itemDetails} onChange={e => setFormData({...formData, itemDetails: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Total Price (Rs.)</label>
                  <input required type="number" className="input-field" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Down Payment (Rs.)</label>
                  <input required type="number" className="input-field" value={formData.downPayment} onChange={e => setFormData({...formData, downPayment: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Monthly Kist (Rs.)</label>
                  <input required type="number" className="input-field" value={formData.installmentAmount} onChange={e => setFormData({...formData, installmentAmount: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Duration (Months)</label>
                  <input required type="number" className="input-field" value={formData.durationMonths} onChange={e => setFormData({...formData, durationMonths: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex items-center justify-center gap-2 mt-4 font-bold">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Installment Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPayModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md bg-slate-900 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Record Kist Payment</h3>
              <button onClick={() => setIsPayModalOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-6">
               <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Customer</p>
                  <p className="font-bold text-white">{selectedPlan.customerName}</p>
                  <p className="text-[10px] text-slate-500 mt-2">Remaining Balance</p>
                  <p className="text-2xl font-black text-rose-400">Rs. {selectedPlan.remainingAmount.toLocaleString()}</p>
               </div>
               
               <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Payment Amount (Rs.)</label>
                    <input required type="number" className="input-field text-xl font-bold text-emerald-400" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder={`Recommended: ${selectedPlan.installmentAmount}`} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex items-center justify-center gap-2 font-bold">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Payment'}
                  </button>
               </form>

               <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><History className="w-3 h-3" /> Recent History</h4>
                  <div className="max-h-[150px] overflow-y-auto space-y-2">
                     {selectedPlan.payments.slice().reverse().map((pay, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-800/50 text-[11px]">
                           <span className="text-slate-400">{new Date(pay.date).toLocaleDateString()}</span>
                           <span className="text-slate-300 italic">{pay.note}</span>
                           <span className="font-bold text-emerald-400">Rs. {pay.amount.toLocaleString()}</span>
                        </div>
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
