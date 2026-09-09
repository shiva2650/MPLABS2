import { User } from '../types/index.js';
import { users, sha256Hex } from '../data/mockData.js';
import { authStorage } from './authStorage.js';

// Static GitHub Pages demo authentication.
// IMPORTANT: GitHub Pages cannot run a private backend, so this is demo-only
// authentication for static hosting. It must not be treated as production security.
const DEMO_PASSWORD_SHA256: Record<string, string> = {
  ADMIN001: 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7',
  MP001: '252b799a3b2c261ffdb4b3da81ee3452fac83e6edd8197170f6e74da438a6dfb',
  AGENCY001: '490be26cc04eb7194b30f5ce3019304ec20666d7696d763d77f6dbd961776c6e',
  SUPER001: '910a6dcddd60dd06a7a2bca84dc2cfb0ec55dd3dec55c19c58eb2c86bd86a92b',
  PM001: '38b9fd38eb43a388f5324beaec69b4966013820269d72defd59e4d34185d73ae',
  VIEWER001: '06470f816c6846a98c2a79c2ce2cfa4fcb4ad935a8e4252065e99370ec119e0c',
  MP002: 'c62b60a194f7ab8078d188016bd9ecf498b82984c41f0538340d1cbca3226051',
  AGENCY002: '280ea2612fdff0edf043254855ef2fa595e85b3396c35f2c42cff5c5a8aa0cf8'
};

function toSafeUser(user: (typeof users)[number]): User {
  return {
    id: user.id,
    userId: user.userId,
    name: user.name,
    role: user.role,
    designation: user.designation,
    constituency: user.constituency,
    district: user.district,
    email: user.email,
    phone: user.phone,
    agencyId: user.agencyId,
    agencyName: user.agencyName
  };
}

export function staticLogin(userId: string, password: string): { token: string; user: User; message: string } {
  const normalizedId = String(userId).trim().toUpperCase();
  const user = users.find(u => u.userId.toUpperCase() === normalizedId);
  const expected = DEMO_PASSWORD_SHA256[normalizedId];
  const supplied = sha256Hex(String(password));

  if (!user || !expected || supplied !== expected) {
    throw new Error('Invalid User ID or password.');
  }

  const safeUser = toSafeUser(user);
  const token = `mplads-static-${normalizedId}-${Date.now()}`;
  authStorage.setToken(token);
  authStorage.setUser(safeUser);
  return { token, user: safeUser, message: `Welcome, ${safeUser.name}` };
}

export function staticGetMe(): { user: User } {
  const user = authStorage.getUser();
  if (!user || !authStorage.getToken()) throw new Error('No active session found');
  return { user };
}

export function staticLogout(): void {
  authStorage.removeToken();
}
