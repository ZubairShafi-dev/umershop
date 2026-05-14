import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  Loader2
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
    avgProfitPerDevice: 0
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
      const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.salePrice || 0), 0);
      const totalProfit = salesData.reduce((sum, sale) => sum + (sale.profit || 0), 0);
      
      setStats({
        totalRevenue,
        totalProfit,
        totalSales: salesData.length,
        avgProfitPerDevice: salesData.length > 0 ? totalProfit / salesData.length : 0
      });

    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare Chart Data (Aggregated by day)
  const chartData = sales.reduce((acc, sale) => {
    const date = new Date(sale.soldAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.revenue += sale.salePrice;
      existing.profit += sale.profit;
    } else {
      acc.push({ date, revenue: sale.salePrice, profit: sale.profit });
    }
    return acc;
  }, []).reverse().slice(-parseInt(timeRange));

  // Prepare Model Popularity Data
  const modelData = sales.reduce((acc, sale) => {
    const model = `${sale.brand} ${sale.model}`;
    const existing = acc.find(d => d.model === model);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ model, count: 1 });
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
          <p className="text-slate-400 text-sm">Detailed insights into your sales performance and profits.</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 px-4 py-2 outline-none focus:ring-1 focus:ring-primary-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-l-primary-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-white">Rs. {stats.totalRevenue.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>Growth trend active</span>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Profit</p>
          <p className="text-2xl font-bold text-emerald-400">Rs. {stats.totalProfit.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2">Margin: {((stats.totalProfit / stats.totalRevenue) * 100 || 0).toFixed(1)}%</p>
        </div>
        <div className="card p-6 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Units Sold</p>
          <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
          <p className="text-[10px] text-slate-500 mt-2">Inventory turnover active</p>
        </div>
        <div className="card p-6 border-l-4 border-l-indigo-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Profit / Unit</p>
          <p className="text-2xl font-bold text-white">Rs. {Math.round(stats.avgProfitPerDevice).toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2">Performance metric</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Revenue vs Profit Trend</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4, fill: '#14b8a6' }} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Models Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Best Selling Models</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} hide />
                <YAxis dataKey="model" type="category" stroke="#94a3b8" fontSize={11} width={120} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  cursor={{ fill: '#1e293b' }}
                />
                <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Sales Log */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Detailed Sales History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Device Details</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Sale Price</th>
                <th className="px-6 py-4 font-medium">Profit</th>
                <th className="px-6 py-4 font-medium">Sold By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 italic">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{new Date(sale.soldAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">{new Date(sale.soldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{sale.brand} {sale.model}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{sale.imei}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300">{sale.customerName || 'Walk-in Customer'}</div>
                      <div className="text-[10px] text-slate-500">{sale.customerPhone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      Rs. {sale.salePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-400">
                      Rs. {sale.profit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {sale.soldBy}
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
