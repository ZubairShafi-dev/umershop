import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Loader2
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a'];

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStock: 0,
    soldToday: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
  const [distributionData, setDistributionData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    setLoading(true);
    
    // Real-time Mobiles
    const unsubscribeMobiles = onSnapshot(collection(db, 'mobiles'), (snapshot) => {
      const mobiles = snapshot.docs.map(doc => doc.data());
      const available = mobiles.filter(m => m.status === 'Available');
      
      const brands = available.reduce((acc, m) => {
        acc[m.brand] = (acc[m.brand] || 0) + 1;
        return acc;
      }, {});
      
      const distData = Object.keys(brands).map(name => ({
        name,
        value: brands[name]
      }));
      
      setDistributionData(distData.length > 0 ? distData : [{ name: 'No Stock', value: 0 }]);
      setStats(prev => ({ ...prev, totalStock: available.length }));
      setLoading(false);
    });

    // Real-time Sales
    const qSales = query(collection(db, 'sales'), orderBy('soldAt', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const sales = snapshot.docs.map(doc => doc.data());
      const today = new Date().toDateString();
      const salesToday = sales.filter(s => new Date(s.soldAt).toDateString() === today);

      const totalRevenue = sales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
      const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);

      setStats(prev => ({
        ...prev,
        soldToday: salesToday.length,
        totalRevenue,
        totalProfit
      }));
      setRecentSales(sales.slice(0, 5));
    });

    return () => {
      unsubscribeMobiles();
      unsubscribeSales();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm">Live inventory and sales tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Stock" value={`${stats.totalStock} Units`} icon={Package} color="primary" />
        <StatCard title="Sold Today" value={`${stats.soldToday} Units`} icon={ShoppingCart} color="emerald" />
        <StatCard title="Total Revenue" value={`Rs. ${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="amber" />
        <StatCard title="Total Profit" value={`Rs. ${stats.totalProfit.toLocaleString()}`} icon={DollarSign} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 flex flex-col items-center justify-center text-slate-500 italic">
           <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
           <p>Sales trends will sync automatically.</p>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Stock by Brand</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {distributionData.map((brand, i) => (
              <div key={brand.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {brand.name}
                </div>
                <span className="text-white font-medium">{brand.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-800"><h3 className="text-lg font-bold text-white">Recent Sales</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Device</th>
                <th className="px-6 py-4">IMEI</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentSales.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">Waiting for first sale...</td></tr>
              ) : (
                recentSales.map((sale, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{sale.brand} {sale.model}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono">{sale.imei}</td>
                    <td className="px-6 py-4 text-white">Rs. {sale.salePrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(sale.soldAt).toLocaleDateString()}</td>
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
