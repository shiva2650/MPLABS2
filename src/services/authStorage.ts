import { User } from '../types/index.js';

const TOKEN_KEY = 'mplads_auth_token';
const USER_KEY = 'mplads_auth_user';

let inMemoryToken: string | null = null;
let inMemoryUser: User | null = null;

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try { return sessionStorage.getItem(TOKEN_KEY) || inMemoryToken; } catch { return inMemoryToken; }
    }
    return inMemoryToken;
  },
  setToken: (token: string) => {
    inMemoryToken = token;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
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
        return raw ? JSON.parse(raw) as User : inMemoryUser;
      } catch { return inMemoryUser; }
    }
    return inMemoryUser;
  },
  setUser: (user: User) => {
    inMemoryUser = user;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
    }
  }
};

export { TOKEN_KEY, USER_KEY };
