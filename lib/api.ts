/**
 * Single Axios instance with silent token refresh
 *
 * - Routes through Next.js proxy to avoid CORS
 * - Attaches access token from localStorage
 * - On 401: attempts a single refresh, queues concurrent failures,
 *   then replays them with the new token.  Falls back to logout
 *   only when refresh itself fails.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStore } from "./token";

/* =========================
   Environment Validation
========================= */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is missing. Please set it in .env.local"
  );
}

/* =========================
   Axios Instance
========================= */

export const api = axios.create({
  baseURL: "/api/proxy",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   Request Interceptor
========================= */

api.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* =========================
   Response Interceptor
   - Refresh-token queue pattern
========================= */

interface QueueItem {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token);
    }
  });
  failedQueue = [];
};

function forceLogout() {
  tokenStore.clearAll();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

const REFRESH_PATH = "/api/admin/auth/refresh";

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Never retry the refresh call itself
    if (originalRequest.url?.includes(REFRESH_PATH)) {
      forceLogout();
      return Promise.reject(error);
    }

    // Already retried this request once — give up
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // If another refresh is in-flight, queue this request
    if (isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const currentRefreshToken = tokenStore.getRefreshToken();
    const userId = tokenStore.getUserId();

    if (!currentRefreshToken || !userId) {
      isRefreshing = false;
      forceLogout();
      return Promise.reject(error);
    }

    try {
      // Import dal lazily to avoid circular dependency (dal imports api)
      const { refreshToken: refreshTokenApi } = await import("./dal");

      const data = await refreshTokenApi({
        userId,
        refreshToken: currentRefreshToken,
      });

      tokenStore.set(data.accessToken);
      tokenStore.setRefreshToken(data.refreshToken);

      processQueue(null, data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
