import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import AddMobile from './pages/AddMobile';
import Inventory from './pages/Inventory';
import IMEISearch from './pages/IMEISearch';
import SalesScreen from './pages/SalesScreen';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Accessories from './pages/Accessories';
import Expenses from './pages/Expenses';
import Installments from './pages/Installments';
import SuspendedScreen from './components/SuspendedScreen';

// Change to true to manually activate the suspension screen,
// or configure it via the VITE_APP_SUSPENDED=true environment variable in Vercel.
const IS_SUSPENDED = import.meta.env.VITE_APP_SUSPENDED === 'true' || false;

function App() {
  if (IS_SUSPENDED) {
    return <SuspendedScreen />;
  }

  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#1e293b',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#1e293b',
              },
            },
          }} 
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            
            <Route path="add-mobile" element={<AddMobile />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="search" element={<IMEISearch />} />
            <Route path="sales" element={<SalesScreen />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="accessories" element={<Accessories />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="installments" element={<Installments />} />
            <Route path="settings" element={<Settings />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
