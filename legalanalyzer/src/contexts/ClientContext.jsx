// src/contexts/ClientContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserIdFromToken } from '../services/apiService';

const ClientContext = createContext(null);

export const ClientProvider = ({ children }) => {
  const [selectedClientId, setSelectedClientIdState] = useState(() => {
    // Initialize from localStorage but validate it belongs to current user
    // (full validation happens in ClientSelector on mount)
    return localStorage.getItem('selectedClientId') || null;
  });

  // Persist to localStorage whenever selection changes
  const setSelectedClientId = useCallback((clientId) => {
    setSelectedClientIdState(clientId);
    if (clientId) {
      localStorage.setItem('selectedClientId', clientId);
    } else {
      localStorage.removeItem('selectedClientId');
    }
  }, []);

  // Reset client selection when the user changes (e.g., logout / re-login)
  useEffect(() => {
    const handleStorageChange = () => {
      const userId = getUserIdFromToken();
      if (!userId) {
        // User logged out — clear selection
        setSelectedClientIdState(null);
        localStorage.removeItem('selectedClientId');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ClientContext.Provider value={{ selectedClientId, setSelectedClientId }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

export default ClientContext;