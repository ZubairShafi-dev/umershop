import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  LogOut, 
  Save, 
  Mail,
  Smartphone,
  MapPin,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Settings() {
  const { currentUser, userRole, logout } = useAuth();
  const [shopInfo, setShopInfo] = useState({
    name: 'Umar Mobile & Accessories',
    ownerName: 'Umar Shafi',
    address: 'Main Bazaar, Near Clock Tower',
    phone: '+92 300 6317013',
    currency: 'PKR (Rs.)',
    language: 'English'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'shop');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setShopInfo(docSnap.data());
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'settings', 'shop');
      await setDoc(docRef, shopInfo);
      toast.success("Shop settings updated successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save shop info.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <SettingsIcon className="w-6 h-6 text-primary-400" />
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Tabs */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20 font-medium text-sm">
            <User className="w-4 h-4" />
            My Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium text-sm text-left">
            <Shield className="w-4 h-4" />
            Security & Roles
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{currentUser?.email?.split('@')[0]}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary-500/10 text-primary-400 border border-primary-500/20">
                  {userRole}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    className="input-field bg-slate-900 text-slate-500 cursor-not-allowed pl-10"
                    value={currentUser?.email || ''}
                  />
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                </div>
              </div>
              <button className="btn-secondary w-full py-2.5 text-sm">
                Change Password
              </button>
            </div>
          </div>

          {/* Shop Configuration */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-slate-800">
                <Smartphone className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Shop Information</h3>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Shop Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={shopInfo.name}
                    onChange={(e) => setShopInfo({...shopInfo, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Owner Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={shopInfo.ownerName || ''}
                    onChange={(e) => setShopInfo({...shopInfo, ownerName: e.target.value})}
                    placeholder="e.g. Umar Shafi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={shopInfo.phone}
                    onChange={(e) => setShopInfo({...shopInfo, phone: e.target.value})}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Shop Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={shopInfo.address || ''}
                    onChange={(e) => setShopInfo({...shopInfo, address: e.target.value})}
                    placeholder="e.g. Main Bazaar, Near Clock Tower"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Currency</label>
                  <select 
                    className="input-field"
                    value={shopInfo.currency || 'PKR (Rs.)'}
                    onChange={(e) => setShopInfo({...shopInfo, currency: e.target.value})}
                  >
                    <option>PKR (Rs.)</option>
                    <option>USD ($)</option>
                  </select>
                </div>
              </div>
              
              <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </form>
          </div>

          {/* Logout Section */}
          <div className="card p-6 border-rose-500/10 bg-rose-500/5">
            <h3 className="text-lg font-bold text-rose-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-400 mb-6">Once you sign out, you will need your credentials to re-access the inventory system.</p>
            <button 
              onClick={() => logout()}
              className="btn-secondary w-full py-3 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
