import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    // If a specific role is required, and user doesn't have it (and isn't admin)
    // redirect to dashboard or an unauthorized page
    return <Navigate to="/" />;
  }

  return children;
}
