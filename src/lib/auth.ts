// Auth is fully client-side using Web Crypto + localStorage — safe for GitHub Pages.
// Default admin password: "admin"   (change via the Admin › Settings panel)

const DEFAULT_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
const PW_KEY = 'italksign_admin_pw';
const SESSION_KEY = 'italksign_admin_session';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 h

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function storedHash(): string {
  return localStorage.getItem(PW_KEY) ?? DEFAULT_HASH;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function login(password: string): Promise<AuthResult> {
  if (!password.trim()) return { ok: false, error: 'Password is required.' };
  const hash = await sha256(password);
  if (hash !== storedHash()) return { ok: false, error: 'Incorrect password.' };
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: crypto.randomUUID(), expiresAt: Date.now() + SESSION_TTL }),
  );
  return { ok: true };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { token, expiresAt } = JSON.parse(raw);
    if (!token || Date.now() > expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function changePassword(current: string, next: string): Promise<AuthResult> {
  if (next.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
  const hash = await sha256(current);
  if (hash !== storedHash()) return { ok: false, error: 'Current password is incorrect.' };
  localStorage.setItem(PW_KEY, await sha256(next));
  return { ok: true };
}
