import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  Loader2,
  Smartphone,
  ChevronDown,
  PieChart as PieIcon,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart, 
  Area
} from 'recharts';

const COLORS = ['#14b8a6', '#f59e0b', '#3b82f6', '#ec4899'];

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // days
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    mobileProfit: 0,
    accessoryProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalInvoices: 0
  });

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch Sales
      const salesSnap = await getDocs(query(collection(db, 'sales'), orderBy('soldAt', 'desc')));
      const salesData = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch Expenses
      const expSnap = await getDocs(collection(db, 'expenses'));
      const expData = expSnap.docs.map(doc => doc.data());
      const totalExpenses = expData.reduce((sum, e) => sum + e.amount, 0);

      setSales(salesData);

      // Calculate Stats
      let totalRevenue = 0;
      let totalProfit = 0;
      let mobileProfit = 0;
      let accessoryProfit = 0;

      salesData.forEach(sale => {
        totalRevenue += (sale.totalAmount || sale.salePrice || 0);
        totalProfit += (sale.totalProfit || sale.profit || 0);
        
        if (sale.items) {
           sale.items.forEach(item => {
             if (item.type === 'mobile') mobileProfit += item.profit;
             else accessoryProfit += item.profit;
           });
        } else {
           mobileProfit += (sale.profit || 0);
        }
      });
      
      setStats({
        totalRevenue,
        totalProfit,
        mobileProfit,
        accessoryProfit,
        totalExpenses,
        netProfit: totalProfit - totalExpenses,
        totalInvoices: salesData.length
      });

    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare Profit Source Data (Pie Chart)
  const profitSourceData = [
    { name: 'Mobiles', value: stats.mobileProfit },
    { name: 'Accessories', value: stats.accessoryProfit }
  ];

  // Prepare Monthly Data
  const monthlyData = sales.reduce((acc, sale) => {
    const month = new Date(sale.soldAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const existing = acc.find(d => d.month === month);
    const profit = (sale.totalProfit || sale.profit || 0);
    const revenue = (sale.totalAmount || sale.salePrice || 0);
    
    if (existing) {
      existing.profit += profit;
      existing.revenue += revenue;
      existing.sales += 1;
    } else {
      acc.push({ month, profit, revenue, sales: 1 });
    }
    return acc;
  }, []).reverse();

  // Prepare Daily Trend
  const dailyData = sales.reduce((acc, sale) => {
    const date = new Date(sale.soldAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.profit += (sale.totalProfit || sale.profit || 0);
    } else {
      acc.push({ date, profit: (sale.totalProfit || sale.profit || 0) });
    }
    return acc;
  }, []).reverse().slice(-parseInt(timeRange));

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-400" />
            Profit & Loss Analytics
          </h1>
          <p className="text-slate-400 text-sm">Detailed financial performance breakdown.</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 px-4 py-2 outline-none"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button className="btn-secondary flex items-center gap-2 text-sm border-slate-700">
             <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-slate-900/40 border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-500/10"><DollarSign className="w-5 h-5 text-primary-400" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net Revenue</p>
          </div>
          <p className="text-2xl font-black text-white">Rs. {stats.totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2">Gross income from all sales</p>
        </div>

        <div className="card p-6 bg-emerald-500/5 border-emerald-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Profit</p>
          </div>
          <p className="text-2xl font-black text-emerald-400">Rs. {stats.totalProfit.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-2">Margin: {((stats.totalProfit / stats.totalRevenue) * 100 || 0).toFixed(1)}%</p>
        </div>

        <div className="card p-6 bg-rose-500/5 border-rose-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-rose-500/10"><CreditCard className="w-5 h-5 text-rose-400" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Expenses</p>
          </div>
          <p className="text-2xl font-black text-rose-400">Rs. {stats.totalExpenses.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2">Rent, bills, and shop costs</p>
        </div>

        <div className="card p-6 bg-primary-500/5 border-primary-500/10 shadow-lg shadow-primary-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-500/10"><CheckCircle2 className="w-5 h-5 text-primary-400" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net Profit</p>
          </div>
          <p className="text-2xl font-black text-white">Rs. {stats.netProfit.toLocaleString()}</p>
          <p className="text-[10px] text-primary-500 font-bold mt-2">Final savings after all costs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 card p-6 bg-slate-900/40">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-400" /> Daily Profit Trend</h3>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={dailyData}>
                 <defs>
                   <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                 <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                 <Area type="monotone" dataKey="profit" stroke="#14b8a6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Profit Source Distribution */}
        <div className="card p-6 bg-slate-900/40">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PieIcon className="w-5 h-5 text-primary-400" /> Profit Source</h3>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={profitSourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                   {profitSourceData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Mobiles</span><span className="text-white font-bold">{((stats.mobileProfit / stats.totalProfit) * 100 || 0).toFixed(1)}%</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Accessories</span><span className="text-white font-bold">{((stats.accessoryProfit / stats.totalProfit) * 100 || 0).toFixed(1)}%</span></div>
           </div>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="card overflow-hidden bg-slate-900/40">
         <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-400" /> Monthly Summary</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                     <th className="px-8 py-4">Month</th>
                     <th className="px-8 py-4">Invoices</th>
                     <th className="px-8 py-4">Revenue</th>
                     <th className="px-8 py-4">Profit</th>
                     <th className="px-8 py-4 text-right">Growth</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {monthlyData.length === 0 ? (
                    <tr><td colSpan="5" className="px-8 py-10 text-center text-slate-500 italic">No historical data found.</td></tr>
                  ) : (
                    monthlyData.map((data, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                         <td className="px-8 py-4 font-bold text-white">{data.month}</td>
                         <td className="px-8 py-4 text-slate-400">{data.sales} Sales</td>
                         <td className="px-8 py-4 text-white font-medium">Rs. {data.revenue.toLocaleString()}</td>
                         <td className="px-8 py-4 text-emerald-400 font-bold">Rs. {data.profit.toLocaleString()}</td>
                         <td className="px-8 py-4 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">+ {((data.profit / data.revenue) * 100 || 0).toFixed(1)}%</span>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
