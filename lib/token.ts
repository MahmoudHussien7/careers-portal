/**
 * LocalStorage-based token storage
 * Stores access token, refresh token, and userId
 * Persists across page refreshes
 */

const ACCESS_TOKEN_KEY = "gi_cms_access_token";
const REFRESH_TOKEN_KEY = "gi_cms_refresh_token";
const USER_ID_KEY = "gi_cms_user_id";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable
  }
}

export const tokenStore = {
  get: (): string | null => safeGet(ACCESS_TOKEN_KEY),
  set: (token: string | null): void => safeSet(ACCESS_TOKEN_KEY, token),
  clear: (): void => safeRemove(ACCESS_TOKEN_KEY),
  hasToken: (): boolean => !!safeGet(ACCESS_TOKEN_KEY),

  getRefreshToken: (): string | null => safeGet(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string | null): void => safeSet(REFRESH_TOKEN_KEY, token),

  getUserId: (): string | null => safeGet(USER_ID_KEY),
  setUserId: (id: string | null): void => safeSet(USER_ID_KEY, id),

  clearAll: (): void => {
    safeRemove(ACCESS_TOKEN_KEY);
    safeRemove(REFRESH_TOKEN_KEY);
    safeRemove(USER_ID_KEY);
  },
};
