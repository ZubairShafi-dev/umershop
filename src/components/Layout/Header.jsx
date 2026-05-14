import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, User as UserIcon, LogOut } from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function Header({ onMenuClick }) {
  const { currentUser, userRole, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-200 hidden sm:block">
          Umar Mobile & Accessories
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
        </button>

        <HeadlessMenu as="div" className="relative">
          <HeadlessMenu.Button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-slate-300" />
            </div>
            <div className="hidden sm:block text-left mr-1">
              <p className="text-sm font-medium text-slate-200 leading-none mb-1">
                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-400 uppercase tracking-wider leading-none">
                {userRole || 'User'}
              </p>
            </div>
          </HeadlessMenu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <HeadlessMenu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-slate-800 shadow-lg shadow-black/50 ring-1 ring-white/5 focus:outline-none overflow-hidden">
              <div className="p-1">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-rose-500/10 text-rose-400' : 'text-rose-400'
                      } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors`}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  )}
                </HeadlessMenu.Item>
              </div>
            </HeadlessMenu.Items>
          </Transition>
        </HeadlessMenu>
      </div>
    </header>
  );
}
