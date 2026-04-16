const SESSION_KEY = 'app_auth';
const HASH = import.meta.env.VITE_APP_PASSWORD_HASH ?? '';

// WebCrypto SHA-256 — browser-native, no dependencies
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export async function tryLogin(password) {
  const hash = await sha256(password);
  if (hash === HASH) {
    sessionStorage.setItem(SESSION_KEY, '1');
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
