import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Loader2,
  PackageCheck
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';

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
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mobileStock: 0,
    accessoryStock: 0,
    soldToday: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
  const [distributionData, setDistributionData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    setLoading(true);
    
    // 1. Listen to Mobiles
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
      setStats(prev => ({ ...prev, mobileStock: available.length }));
    });

    // 2. Listen to Accessories
    const unsubscribeAccessories = onSnapshot(collection(db, 'accessories'), (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().quantity || 0), 0);
      setStats(prev => ({ ...prev, accessoryStock: total }));
    });

    // 3. Listen to Sales
    const qSales = query(collection(db, 'sales'), orderBy('soldAt', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const today = new Date().toDateString();
      
      let totalRevenue = 0;
      let totalProfit = 0;
      let soldToday = 0;

      sales.forEach(s => {
        const amount = (s.totalAmount || s.salePrice || 0);
        const profit = (s.totalProfit || s.profit || 0);
        totalRevenue += amount;
        totalProfit += profit;
        
        if (new Date(s.soldAt).toDateString() === today) {
           if (s.items) {
             s.items.forEach(item => soldToday += item.qty);
           } else {
             soldToday += 1;
           }
        }
      });

      setStats(prev => ({
        ...prev,
        soldToday,
        totalRevenue,
        totalProfit
      }));
      setRecentSales(sales.slice(0, 5));
      setLoading(false);
    });

    return () => {
      unsubscribeMobiles();
      unsubscribeAccessories();
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
        <p className="text-slate-400 text-sm">Real-time inventory & sales intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Mobile Stock" value={`${stats.mobileStock} Units`} icon={Package} color="primary" />
        <StatCard title="Accessory Items" value={`${stats.accessoryStock} Items`} icon={PackageCheck} color="indigo" />
        {isAdmin && (
          <>
            <StatCard title="Total Revenue" value={`Rs. ${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="amber" />
            <StatCard title="Today's Profit" value={`Rs. ${stats.totalProfit.toLocaleString()}`} icon={DollarSign} color="emerald" />
          </>
        )}
        {!isAdmin && <StatCard title="Sold Today" value={`${stats.soldToday} Units`} icon={ShoppingCart} color="emerald" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
           <h3 className="text-lg font-bold text-white mb-6">Recent Sales Activity</h3>
           <div className="space-y-4">
              {recentSales.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic">No sales activity yet.</div>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                         <ShoppingCart className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {sale.items ? `${sale.items.length} item(s)` : `${sale.brand} ${sale.model}`}
                        </p>
                        <p className="text-[10px] text-slate-500">{new Date(sale.soldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {sale.customerName || 'Walk-in'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-white">Rs. {(sale.totalAmount || sale.salePrice).toLocaleString()}</p>
                       {isAdmin && <p className="text-[10px] text-emerald-400 font-bold">Profit: Rs. {(sale.totalProfit || sale.profit).toLocaleString()}</p>}
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Stock Distribution</h3>
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
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
            {distributionData.map((brand, i) => (
              <div key={brand.name} className="flex items-center justify-between text-xs">
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
    </div>
  );
}
