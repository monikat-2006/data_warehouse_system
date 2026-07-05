import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const verifyAuth = useCallback(async () => {
    try {
      const { data } = await authAPI.verify();
      if (data.is_authenticated) {
        setUser({
          id: data.user_id,
          username: data.username,
          role: data.role,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  const login = async (username, password) => {
    const { data } = await authAPI.login({ username, password });
    if (data.success) {
      setUser({ id: data.user_id, username: data.username, role: data.role });
    }
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
    }
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, verifyAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
