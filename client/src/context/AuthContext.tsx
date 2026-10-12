import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  quickLogin: (role: 'owner' | 'admin' | 'member' | 'viewer') => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS = {
  owner: { email: 'alex@syncboard.dev', name: 'Alex Chen', role: 'Owner' },
  admin: { email: 'sarah@syncboard.dev', name: 'Sarah Connor', role: 'Admin' },
  member: { email: 'jordan@syncboard.dev', name: 'Jordan Smith', role: 'Member' },
  viewer: { email: 'elena@syncboard.dev', name: 'Elena Rostova', role: 'Viewer' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('syncboard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('syncboard_token');
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('syncboard_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('syncboard_user', JSON.stringify(res.data.user));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('syncboard_token', res.data.token);
        localStorage.setItem('syncboard_user', JSON.stringify(res.data.user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('syncboard_token', res.data.token);
        localStorage.setItem('syncboard_user', JSON.stringify(res.data.user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: 'owner' | 'admin' | 'member' | 'viewer') => {
    const account = DEMO_ACCOUNTS[role];
    try {
      await login(account.email, 'Password123!');
    } catch {
      // Offline / Static Preview Mode Fallback:
      const mockUser: User = {
        id: `mock-${role}`,
        name: account.name,
        email: account.email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.name)}`,
      };
      setUser(mockUser);
      setToken(`demo-token-${role}`);
      localStorage.setItem('syncboard_token', `demo-token-${role}`);
      localStorage.setItem('syncboard_user', JSON.stringify(mockUser));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('syncboard_token');
    localStorage.removeItem('syncboard_user');
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updated };
      setUser(newUser);
      localStorage.setItem('syncboard_user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        quickLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
