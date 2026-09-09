import { User } from '../types/index.js';
import { apiUrl, isStaticDeployment } from './apiConfig.js';
import { authStorage } from './authStorage.js';
import { staticGetMe, staticLogin, staticLogout } from './staticAuth.js';

export { authStorage };

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

export const AuthService = {
  login: async (userId: string, password: string): Promise<LoginResponse> => {
    if (isStaticDeployment()) {
      return staticLogin(userId, password);
    }
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId.trim(), password })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid User ID or password.');
        }
        if (response.status === 403) {
          throw new Error('Access denied.');
        }
        const errorPayload = await response.json().catch(() => ({ error: 'Authentication service error' }));
        throw new Error(errorPayload.error || `Authentication service error (HTTP ${response.status})`);
      }

      const data: LoginResponse = await response.json();
      if (!data?.token || !data?.user?.role) {
        throw new Error('Authentication service returned an invalid session.');
      }
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Unable to reach the authentication server. Check the deployed API URL and backend status.');
      }
      throw error;
    }
  },

  getMe: async (): Promise<{ user: User }> => {
    if (isStaticDeployment()) {
      return staticGetMe();
    }
    const token = authStorage.getToken();
    if (!token) {
      authStorage.removeToken();
      throw new Error('No authentication token found');
    }

    const res = await fetch(apiUrl('/api/auth/me'), {
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
    if (isStaticDeployment()) {
      staticLogout();
      return;
    }
    const token = authStorage.getToken();
    try {
      if (token) {
        await fetch(apiUrl('/api/auth/logout'), {
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
