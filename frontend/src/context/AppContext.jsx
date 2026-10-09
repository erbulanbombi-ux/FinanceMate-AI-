import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { isMockMode, setMockMode } from '../api/client';

const AppContext = createContext(null);
const DEMO_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID || '15';
const DEMO_USER = { user_id: DEMO_USER_ID, username: 'Demo Account' };

export function AppProvider({ children }) {
  const currentUser = DEMO_USER;
  const userId = DEMO_USER_ID;

  // Current Period YYYY-MM
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [demoMode, setDemoModeState] = useState(isMockMode);

  // Connection status: 'idle' | 'testing' | 'connected' | 'error'
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [connectionError, setConnectionError] = useState(null);

  const toggleDemoMode = (enabled) => {
    const val = typeof enabled === 'boolean' ? enabled : !demoMode;
    setMockMode(val);
    setDemoModeState(val);
    if (!val) {
      testConnection();
    } else {
      setConnectionStatus('connected');
      setConnectionError(null);
    }
  };

  // Test connection to backend
  const testConnection = useCallback(async () => {
    if (isMockMode()) {
      setConnectionStatus('connected');
      setConnectionError(null);
      return true;
    }

    setConnectionStatus('testing');
    setConnectionError(null);

    try {
      // Try hitting /api/dashboard or /docs
      await apiClient.get('/api/dashboard', {
        params: { period: currentPeriod },
        timeout: 5000,
      });
      setConnectionStatus('connected');
      setConnectionError(null);
      return true;
    } catch (err) {
      // If server responded with 404/401/422, the server IS connected and reachable!
      if (err.status || err.response) {
        setConnectionStatus('connected');
        setConnectionError(null);
        return true;
      }
      setConnectionStatus('error');
      setConnectionError(err.message || 'Unable to connect to FinMate backend');
      return false;
    }
  }, [currentPeriod]);

  useEffect(() => {
    if (!demoMode) {
      testConnection();
    }
  }, [demoMode, testConnection]);

  // Format currency helper
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₸0';
    const num = Math.round(Number(amount));
    return '₸' + num.toLocaleString('ru-RU');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        userId,
        currentPeriod,
        setCurrentPeriod,
        apiUrl: '/api (same-origin proxy)',
        demoMode,
        toggleDemoMode,
        connectionStatus,
        connectionError,
        testConnection,
        formatCurrency,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
