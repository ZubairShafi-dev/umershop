import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag, 
  Loader2, 
  X,
  CreditCard,
  Utensils,
  Lightbulb,
  Home,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { name: 'Rent', icon: Home, color: 'text-rose-400' },
  { name: 'Electricity', icon: Lightbulb, color: 'text-amber-400' },
  { name: 'Staff Salary', icon: Briefcase, color: 'text-indigo-400' },
  { name: 'Food/Tea', icon: Utensils, color: 'text-emerald-400' },
  { name: 'Marketing', icon: Tag, color: 'text-primary-400' },
  { name: 'Other', icon: DollarSign, color: 'text-slate-400' }
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addDoc(collection(db, 'expenses'), {
        ...formData,
        amount: parseFloat(formData.amount),
        createdAt: new Date().toISOString()
      });
      toast.success("Expense added!");
      setIsModalOpen(false);
      setFormData({ title: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      toast.error("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this expense?")) {
      await deleteDoc(doc(db, 'expenses', id));
      toast.success("Expense deleted");
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-400" /> Expense Management
          </h1>
          <p className="text-slate-400 text-sm">Track shop kharcha and utilities.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary py-2 px-6 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-rose-500/5 border-rose-500/10">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Expenses</p>
          <p className="text-3xl font-black text-rose-400">Rs. {totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" /></td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No expenses recorded yet.</td></tr>
              ) : (
                expenses.map((exp) => {
                  const CategoryIcon = CATEGORIES.find(c => c.name === exp.category)?.icon || DollarSign;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-white">{exp.title}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-xs font-medium text-slate-300">
                          <CategoryIcon className="w-3 h-3" />
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-400">Rs. {exp.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md bg-slate-900 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Record New Expense</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Expense Title</label>
                <input required type="text" placeholder="e.g. Shop Rent June" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Amount (Rs.)</label>
                  <input required type="number" placeholder="0" className="input-field" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Date</label>
                  <input required type="date" className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Category</label>
                <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4 font-bold">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
