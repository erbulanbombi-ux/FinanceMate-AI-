import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { isMockMode, setMockMode } from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const userId = currentUser?.user_id ?? null;

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

  const completeAuthentication = (data) => {
    setCurrentUser(data.user);
    setAuthLoading(false);
  };

  const login = async (credentials) => {
    const { data } = await apiClient.post('/api/auth/login', credentials);
    completeAuthentication(data);
    return data.user;
  };

  const register = async (credentials) => {
    const { data } = await apiClient.post('/api/auth/register', credentials);
    return data.message;
  };

  const verifyEmail = async (token) => {
    const { data } = await apiClient.post('/api/auth/verify-email', { token });
    return data.message;
  };

  const resendVerification = async (email) => {
    const { data } = await apiClient.post('/api/auth/resend-verification', { email });
    return data.message;
  };

  const requestPasswordReset = async (email) => {
    const { data } = await apiClient.post('/api/auth/forgot-password', { email });
    return data.message;
  };

  const resetPassword = async (token, password) => {
    const { data } = await apiClient.post('/api/auth/reset-password', { token, password });
    return data.message;
  };

  const logout = async () => {
    try {
      if (currentUser) await apiClient.post('/api/auth/logout');
    } finally {
      setCurrentUser(null);
      setConnectionStatus('idle');
    }
  };

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
    if (!currentUser) {
      setConnectionStatus('idle');
      setConnectionError(null);
      return false;
    }
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
  }, [currentPeriod, currentUser]);

  // Restore the account session when the app reloads.
  useEffect(() => {
    let active = true;
    apiClient.get('/api/auth/me')
      .then(({ data }) => {
        if (active) setCurrentUser(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setAuthLoading(false);
    };
    window.addEventListener('finmate:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('finmate:auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    if (currentUser && !demoMode) {
      testConnection();
    }
  }, [currentUser, demoMode, testConnection]);

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
        authLoading,
        login,
        register,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        resetPassword,
        logout,
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
