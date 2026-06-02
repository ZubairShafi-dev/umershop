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

const formatSaleDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${timeStr}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeStr}`;
  } else {
    return `${date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  }
};

export default function Dashboard() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [loading, setLoading] = useState(true);
  const [mobiles, setMobiles] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    setLoading(true);
    let mobilesLoaded = false;
    let accessoriesLoaded = false;
    let salesLoaded = false;

    const checkLoading = () => {
      if (mobilesLoaded && accessoriesLoaded && salesLoaded) {
        setLoading(false);
      }
    };

    // 1. Listen to Mobiles
    const unsubscribeMobiles = onSnapshot(collection(db, 'mobiles'), (snapshot) => {
      setMobiles(snapshot.docs.map(doc => doc.data()));
      mobilesLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Error loading mobiles:", error);
    });

    // 2. Listen to Accessories
    const unsubscribeAccessories = onSnapshot(collection(db, 'accessories'), (snapshot) => {
      setAccessories(snapshot.docs.map(doc => doc.data()));
      accessoriesLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Error loading accessories:", error);
    });

    // 3. Listen to Sales
    const qSales = query(collection(db, 'sales'), orderBy('soldAt', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      salesLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Error loading sales:", error);
    });

    return () => {
      unsubscribeMobiles();
      unsubscribeAccessories();
      unsubscribeSales();
    };
  }, []);

  const availableMobiles = mobiles.filter(m => m.status === 'Available');
  const mobileStockCount = availableMobiles.length;
  
  const accessoryStockCount = accessories.reduce((sum, a) => sum + (a.quantity || 0), 0);

  // Stock Valuation
  const mobileStockCost = availableMobiles.reduce((sum, m) => sum + (parseFloat(m.purchasePrice) || 0), 0);
  const mobileStockSaleValue = availableMobiles.reduce((sum, m) => sum + (parseFloat(m.sellingPrice) || 0), 0);

  const accessoryStockCost = accessories.reduce((sum, a) => sum + ((parseFloat(a.purchasePrice) || 0) * (parseInt(a.quantity) || 0)), 0);
  const accessoryStockSaleValue = accessories.reduce((sum, a) => sum + ((parseFloat(a.sellingPrice) || 0) * (parseInt(a.quantity) || 0)), 0);

  const totalStockCost = mobileStockCost + accessoryStockCost;
  const totalStockSaleValue = mobileStockSaleValue + accessoryStockSaleValue;

  // Sales Analytics
  const today = new Date().toDateString();
  let totalRevenue = 0;
  let totalProfit = 0;
  let todayRevenue = 0;
  let todayProfit = 0;
  let soldToday = 0;

  sales.forEach(s => {
    const amount = (s.totalAmount || s.salePrice || 0);
    const profit = (s.totalProfit || s.profit || 0);
    totalRevenue += amount;
    totalProfit += profit;
    
    if (new Date(s.soldAt).toDateString() === today) {
       todayRevenue += amount;
       todayProfit += profit;
       if (s.items) {
         s.items.forEach(item => soldToday += item.qty);
       } else {
         soldToday += 1;
       }
    }
  });

  const recentSales = sales.slice(0, 5);

  const brands = availableMobiles.reduce((acc, m) => {
    if (!acc[m.brand]) {
      acc[m.brand] = { count: 0, cost: 0, sellingValue: 0 };
    }
    acc[m.brand].count += 1;
    acc[m.brand].cost += parseFloat(m.purchasePrice) || 0;
    acc[m.brand].sellingValue += parseFloat(m.sellingPrice) || 0;
    return acc;
  }, {});
  
  const distributionData = Object.keys(brands).map(name => ({
    name,
    value: brands[name].count,
    cost: brands[name].cost,
    sellingValue: brands[name].sellingValue
  }));
  const finalDistributionData = distributionData.length > 0 
    ? distributionData 
    : [{ name: 'No Stock', value: 0, cost: 0, sellingValue: 0 }];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.name === 'No Stock') return null;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-white uppercase">{data.name}</p>
          <p className="text-slate-400">Stock: <span className="text-white font-semibold">{data.value} Unit(s)</span></p>
          <p className="text-slate-400">Selling Value: <span className="text-emerald-400 font-bold">Rs. {data.sellingValue.toLocaleString()}</span></p>
          {isAdmin && (
            <p className="text-slate-400">Cost Value: <span className="text-rose-400 font-bold">Rs. {data.cost.toLocaleString()}</span></p>
          )}
        </div>
      );
    }
    return null;
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard title="Mobile Stock" value={`${mobileStockCount} Units`} icon={Package} color="primary" />
        <StatCard title="Accessory Items" value={`${accessoryStockCount} Items`} icon={PackageCheck} color="indigo" />
        {isAdmin && (
          <StatCard title="Stock Value (Cost)" value={`Rs. ${totalStockCost.toLocaleString()}`} icon={DollarSign} color="rose" />
        )}
        <StatCard title="Stock Value (Selling)" value={`Rs. ${totalStockSaleValue.toLocaleString()}`} icon={TrendingUp} color="emerald" />
        
        {isAdmin && (
          <>
            <StatCard title="Total Revenue" value={`Rs. ${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="amber" />
            <StatCard title="Today's Profit" value={`Rs. ${todayProfit.toLocaleString()}`} icon={DollarSign} color="emerald" />
            <StatCard title="Total Profit" value={`Rs. ${totalProfit.toLocaleString()}`} icon={DollarSign} color="teal" />
          </>
        )}
        {!isAdmin && <StatCard title="Sold Today" value={`${soldToday} Units`} icon={ShoppingCart} color="emerald" />}
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
                        <p className="text-[10px] text-slate-500">{formatSaleDate(sale.soldAt)} · {sale.customerName || 'Walk-in'}</p>
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
                <Pie data={finalDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {finalDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
            {finalDistributionData.map((brand, i) => (
              <div key={brand.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {brand.name}
                </div>
                <span className="text-white font-medium">
                  {brand.value} {brand.value === 1 ? 'Unit' : 'Units'} {brand.name !== 'No Stock' && `(Rs. ${brand.sellingValue.toLocaleString()})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
