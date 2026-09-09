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
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Never grant role elevation purely based on unvalidated client storage
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(() => {
    return localStorage.getItem('mplads_public_mode') === 'true';
  });

  const validateSession = async (): Promise<boolean> => {
    const token = authStorage.getToken();
    if (!token) {
      setUser(null);
      return false;
    }
    try {
      const res = await AuthService.getMe();
      if (res && res.user) {
        setUser(res.user);
        authStorage.setUser(res.user);
        return true;
      }
      setUser(null);
      authStorage.removeToken();
      return false;
    } catch {
      setUser(null);
      authStorage.removeToken();
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = authStorage.getToken();
      if (token) {
        try {
          const res = await AuthService.getMe();
          if (res && res.user && res.user.role) {
            setUser(res.user);
            authStorage.setUser(res.user);
            setIsPublicMode(false);
            localStorage.removeItem('mplads_public_mode');
          } else {
            authStorage.removeToken();
            setUser(null);
          }
        } catch {
          authStorage.removeToken();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for server-side unauthorized/forbidden signals during any sensitive request
    const handleUnauthorized = () => {
      console.warn('[AuthContext] Unauthorized role elevation or expired session rejected by server. Revoking access.');
      authStorage.removeToken();
      setUser(null);
      setIsPublicMode(true);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
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
    } catch {
      // ignore network errors on logout
    } finally {
      authStorage.removeToken();
      localStorage.removeItem('mplads_public_mode');
      setUser(null);
      setIsPublicMode(false);
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
        validateSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
