import { User } from '../types/index.js';

const TOKEN_KEY = 'mplads_auth_token';
const USER_KEY = 'mplads_auth_user';

// In-memory fallback if sessionStorage is blocked
let inMemoryToken: string | null = null;
let inMemoryUser: User | null = null;

// Clean up any legacy persistent localStorage tokens to mitigate XSS persistence
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

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

export const AuthService = {
  login: async (userId: string, password: string): Promise<LoginResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, password })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid User ID or Password.');
      }
      const errorPayload = await response.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(errorPayload.error || `Authentication failed (Status ${response.status})`);
    }

    const data: LoginResponse = await response.json();
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const token = authStorage.getToken();
    if (!token) {
      authStorage.removeToken();
      throw new Error('No authentication token found');
    }

    const res = await fetch('/api/auth/me', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (!data || !data.user || !data.user.role) {
        authStorage.removeToken();
        throw new Error('Invalid user profile received from server');
      }
      authStorage.setUser(data.user);
      return data;
    }

    if (res.status === 401 || res.status === 403) {
      authStorage.removeToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { status: res.status } }));
      }
      throw new Error('Session expired or unauthorized role elevation rejected by server');
    }

    authStorage.removeToken();
    throw new Error(`Server authentication check failed: HTTP ${res.status}`);
  },

  logout: async (): Promise<void> => {
    const token = authStorage.getToken();
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.warn('[AuthService] Logout network error ignored:', err);
    } finally {
      authStorage.removeToken();
    }
  }
};
