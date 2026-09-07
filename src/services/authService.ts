import { User } from '../types/index.js';
import { clientMockDb } from './clientMockDb.js';

const TOKEN_KEY = 'mplads_auth_token';
const USER_KEY = 'mplads_auth_user';

let inMemoryToken: string | null = null;
let inMemoryUser: User | null = null;

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        return sessionStorage.getItem(TOKEN_KEY) || inMemoryToken;
      } catch {
        return inMemoryToken;
      }
    }
    return inMemoryToken;
  },
  setToken: (token: string) => {
    inMemoryToken = token;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(TOKEN_KEY, token);
      } catch {}
    }
  },
  removeToken: () => {
    inMemoryToken = null;
    inMemoryUser = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      } catch {}
    }
  },
  getUser: (): User | null => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : inMemoryUser;
      } catch {
        return inMemoryUser;
      }
    }
    return inMemoryUser;
  },
  setUser: (user: User) => {
    inMemoryUser = user;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch {}
    }
  }
};

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

const isStaticDeployment = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.endsWith('github.io') ||
    window.location.hostname.includes('githubpreview.dev') ||
    window.location.protocol === 'file:'
  );
};

export const AuthService = {
  login: async (userId: string, password: string): Promise<LoginResponse> => {
    if (isStaticDeployment()) {
      return clientMockDb.login(userId, password);
    }
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          return clientMockDb.login(userId, password);
        }
        if (response.status === 401) {
          throw new Error('Invalid credentials');
        }
        const errPayload = await response.json().catch(() => ({ error: 'Authentication failed' }));
        throw new Error(errPayload.error || `Authentication failed (Status ${response.status})`);
      }
      const data: LoginResponse = await response.json();
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      return data;
    } catch (networkErr: any) {
      try {
        return await clientMockDb.login(userId, password);
      } catch {
        throw new Error(networkErr.message || 'Server unreachable');
      }
    }
  },

  getMe: async (): Promise<{ user: User }> => {
    const token = authStorage.getToken();
    if (!token) throw new Error('No authentication token found');
    if (isStaticDeployment() || token.includes('static')) {
      return clientMockDb.getMe();
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) return res.json();
      if (res.status === 401) {
        authStorage.removeToken();
        throw new Error('Session expired');
      }
      return clientMockDb.getMe();
    } catch {
      return clientMockDb.getMe();
    }
  },

  logout: async (): Promise<void> => {
    const token = authStorage.getToken();
    try {
      if (token && !isStaticDeployment()) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch {}
    await clientMockDb.logout();
    authStorage.removeToken();
  }
};
