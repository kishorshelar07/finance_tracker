import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, userApi } from '../api/index';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  // ── Handle session expiry fired by the axios interceptor ────────────────
  // The interceptor dispatches 'auth:session-expired' instead of doing a hard
  // window.location.href redirect (which would reload the page and restart the
  // refresh loop). We respond with a soft React Router navigation.
  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem('accessToken');
      setUser(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:session-expired', handleExpired);
    return () => window.removeEventListener('auth:session-expired', handleExpired);
  }, [navigate]);

  // ── Restore session on mount ─────────────────────────────────
  // BUG FIX: Old code only checked localStorage for an access token.
  // Access tokens expire in 15 min, so after refresh the user got logged out.
  // Correct approach: ALWAYS try the refresh-token cookie first (httpOnly cookie
  // is always sent automatically). If it succeeds we get a fresh access token
  // and user data. Only after that failure do we truly consider the user logged out.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try silent refresh — uses httpOnly refreshToken cookie automatically
        const { data } = await authApi.refreshToken();
        const { accessToken, user: userData } = data.data;
        localStorage.setItem('accessToken', accessToken);
        setUser(userData);
      } catch {
        // Refresh failed = truly logged out (no valid cookie)
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const { data } = await authApi.login({ email, password, rememberMe });
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const value = { user, loading, login, logout, updateUser, isAuthenticated: !!user };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};