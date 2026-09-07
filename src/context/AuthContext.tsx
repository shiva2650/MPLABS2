import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { AuthService, authStorage } from '../services/authService.js';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  role: UserRole | 'PUBLIC';
  isAuthenticated: boolean;
  isPublicMode: boolean;
  enterPublicMode: () => void;
  exitPublicMode: () => void;
  loading: boolean;
  login: (userId: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (targetRole: 'MP' | 'ADMIN' | 'STATE_NODAL' | 'MINISTRY' | 'AGENCY' | 'PUBLIC') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authStorage.getUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(() => {
    return localStorage.getItem('mplads_public_mode') === 'true';
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = authStorage.getToken();
      if (token) {
        try {
          const res = await AuthService.getMe();
          setUser(res.user);
          authStorage.setUser(res.user);
          setIsPublicMode(false);
          localStorage.removeItem('mplads_public_mode');
        } catch {
          authStorage.removeToken();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const enterPublicMode = () => {
    setIsPublicMode(true);
    localStorage.setItem('mplads_public_mode', 'true');
    setUser(null);
    authStorage.removeToken();
  };

  const exitPublicMode = () => {
    setIsPublicMode(false);
    localStorage.removeItem('mplads_public_mode');
  };

  const login = async (userId: string, pass: string) => {
    const data = await AuthService.login(userId, pass);
    setUser(data.user);
    setIsPublicMode(false);
    localStorage.removeItem('mplads_public_mode');
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch {}
    authStorage.removeToken();
    localStorage.removeItem('mplads_public_mode');
    setUser(null);
    setIsPublicMode(false);
  };

  const switchDemoRole = async (targetRole: 'MP' | 'ADMIN' | 'STATE_NODAL' | 'MINISTRY' | 'AGENCY' | 'PUBLIC') => {
    if (targetRole === 'PUBLIC') {
      enterPublicMode();
      return;
    }
    const demoCreds: Record<'MP' | 'ADMIN' | 'STATE_NODAL' | 'MINISTRY' | 'AGENCY', { id: string; pass: string }> = {
      MP: { id: 'MP001', pass: 'MP@123' },
      ADMIN: { id: 'ADMIN001', pass: 'Admin@123' },
      STATE_NODAL: { id: 'STATE001', pass: 'State@123' },
      MINISTRY: { id: 'MINISTRY001', pass: 'Ministry@123' },
      AGENCY: { id: 'AGENCY001', pass: 'Agency@123' }
    };
    const creds = demoCreds[targetRole];
    if (creds) {
      await login(creds.id, creds.pass);
    }
  };

  const role: UserRole | 'PUBLIC' = isPublicMode ? 'PUBLIC' : user ? user.role : 'PUBLIC';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        role,
        isAuthenticated,
        isPublicMode,
        enterPublicMode,
        exitPublicMode,
        loading,
        login,
        logout,
        switchDemoRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
