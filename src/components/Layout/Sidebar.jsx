import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Smartphone, 
  PlusCircle, 
  Search, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Package,
  Scan,
  CreditCard,
  CalendarDays
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { userRole } = useAuth();

  const isAdmin = userRole === 'admin';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Add Mobile', path: '/add-mobile', icon: PlusCircle },
    { name: 'Accessories', path: '/accessories', icon: Package },
    { name: 'Inventory', path: '/inventory', icon: Smartphone },
    { name: 'IMEI Search', path: '/search', icon: Scan },
    { name: 'Sales', path: '/sales', icon: ShoppingCart },
    { name: 'Sales History', path: '/sales-history', icon: ShoppingCart },
    ...(isAdmin ? [
      { name: 'Purchase History', path: '/purchase-history', icon: Package },
      { name: 'Suppliers', path: '/suppliers', icon: Users },
      { name: 'Reports', path: '/reports', icon: BarChart3 },
      { name: 'Expenses', path: '/expenses', icon: CreditCard },
      { name: 'Installments', path: '/installments', icon: CalendarDays },
    ] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const filteredNav = navItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                <Smartphone className="w-5 h-5 text-primary-400" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Mobiv</span>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-800"
            >
              <PlusCircle className="w-5 h-5 rotate-45" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
