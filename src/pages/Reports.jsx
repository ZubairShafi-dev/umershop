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
  Smartphone
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
  Legend
} from 'recharts';

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // days
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    totalUnits: 0
  });

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const salesSnap = await getDocs(query(collection(db, 'sales'), orderBy('soldAt', 'desc')));
      const salesData = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setSales(salesData);

      // Calculate Stats
      let totalRevenue = 0;
      let totalProfit = 0;
      let totalUnits = 0;

      salesData.forEach(sale => {
        totalRevenue += (sale.totalAmount || sale.salePrice || 0);
        totalProfit += (sale.totalProfit || sale.profit || 0);
        if (sale.items) {
           sale.items.forEach(item => totalUnits += item.qty);
        } else {
           totalUnits += 1;
        }
      });
      
      setStats({
        totalRevenue,
        totalProfit,
        totalSales: salesData.length,
        totalUnits
      });

    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare Chart Data
  const chartData = sales.reduce((acc, sale) => {
    const date = new Date(sale.soldAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    const amount = (sale.totalAmount || sale.salePrice || 0);
    const profit = (sale.totalProfit || sale.profit || 0);
    
    if (existing) {
      existing.revenue += amount;
      existing.profit += profit;
    } else {
      acc.push({ date, revenue: amount, profit });
    }
    return acc;
  }, []).reverse().slice(-parseInt(timeRange));

  // Best Selling Items
  const bestSellers = sales.reduce((acc, sale) => {
    if (sale.items) {
      sale.items.forEach(item => {
        const name = item.name;
        const existing = acc.find(d => d.name === name);
        if (existing) existing.count += item.qty;
        else acc.push({ name, count: item.qty });
      });
    } else {
      const name = `${sale.brand} ${sale.model}`;
      const existing = acc.find(d => d.name === name);
      if (existing) existing.count += 1;
      else acc.push({ name, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-400" />
            Reports & Analytics
          </h1>
          <p className="text-slate-400 text-sm">Comprehensive performance tracking across mobiles and accessories.</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 px-4 py-2 outline-none"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-l-primary-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-white">Rs. {stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-6 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Profit</p>
          <p className="text-2xl font-bold text-emerald-400">Rs. {stats.totalProfit.toLocaleString()}</p>
        </div>
        <div className="card p-6 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
        </div>
        <div className="card p-6 border-l-4 border-l-indigo-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Units Sold</p>
          <p className="text-2xl font-bold text-white">{stats.totalUnits}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Revenue vs Profit Trend</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4, fill: '#14b8a6' }} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Top Selling Items</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bestSellers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={150} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-800"><h3 className="text-lg font-bold text-white">Sales History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items Sold</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-right">Total Price</th>
                <th className="px-6 py-4 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /></td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No sales recorded.</td></tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white">{new Date(sale.soldAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">{new Date(sale.soldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="space-y-1">
                          {sale.items ? sale.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                               <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{item.qty}x</span>
                               <span className="text-slate-300 truncate max-w-[200px]">{item.name}</span>
                            </div>
                          )) : (
                            <div className="flex items-center gap-2">
                               <Smartphone className="w-3 h-3 text-slate-500" />
                               <span className="text-slate-300">{sale.brand} {sale.model}</span>
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{sale.customerName || 'Walk-in'}</td>
                    <td className="px-6 py-4 text-right font-bold text-white">Rs. {(sale.totalAmount || sale.salePrice).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400 text-xs">Rs. {(sale.totalProfit || sale.profit).toLocaleString()}</td>
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
