// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, logout, getUserRole } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';

const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
  const { texts } = useLanguage(); 
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to get current user:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">{texts.loadingAuth || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user) {
    const hasRequiredRole = user.roles?.some(role => allowedRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {texts.accessDenied || 'Access Denied'}
            </h2>
            
            <p className="text-text-secondary mb-6">
              {texts.noPermission || "You don't have permission to access this page."}
              {allowedRoles.length > 0 && (
                <> {texts.requiredRoles || 'Required roles'}: <strong>{allowedRoles.join(', ')}</strong></>
              )}
            </p>
            
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
            >
              {texts.goBack || 'Go Back'}
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;