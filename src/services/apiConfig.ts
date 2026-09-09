/**
 * Runtime API configuration.
 *
 * GitHub Pages is a static host, so this project supports an explicit static
 * demo mode. In static mode all browser data operations are handled by the
 * local demo store; no /api request is attempted.
 *
 * For a real production system, deploy the backend separately and set
 * VITE_API_BASE_URL to its HTTPS origin.
 */
const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').trim();

export const API_BASE_URL = configuredBase.replace(/\/$/, '');

export function isGitHubPagesHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('github.io');
}

export const IS_STATIC_MODE =
  String(import.meta.env.VITE_STATIC_MODE || '').toLowerCase() === 'true' ||
  isGitHubPagesHost() ||
  (typeof window !== 'undefined' && window.location.protocol === 'file:');

export function isStaticDeployment(): boolean {
  return IS_STATIC_MODE;
}

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}
