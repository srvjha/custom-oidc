import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getToken, setToken } from "./auth-storage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Refresh handling
let isRefreshing = false;

type FailedRequestCallback = (token: string) => void;
type FailedRequestReject = (err: any) => void;

let failedRequestsQueue: {
  resolve: FailedRequestCallback;
  reject: FailedRequestReject;
}[] = [];

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry;

    // Check if unauthorized
    const isUnauthorized = error.response?.status === 401;

    // Even if memory is empty, try to refresh because the HttpOnly cookie might exist.
    // We only skip if it's not a 401 or if we've already tried a retry for this request.
    if (!isUnauthorized || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          },
          reject: (err: any) => reject(err),
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      // Our backend sends success: true in ApiResponse, so res.data is expected to have data.accessToken
      if (res.status === 200 && res.data.data?.accessToken) {
        const { accessToken } = res.data.data;
        setToken(accessToken);

        // Retry all queued requests
        failedRequestsQueue.forEach(({ resolve }) => resolve(accessToken));
        failedRequestsQueue = [];

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      }

      throw new Error("Refresh failed");
    } catch (refreshError) {
      // If refresh fails, clear the queue and memory
      failedRequestsQueue.forEach(({ reject }) => reject(refreshError));
      failedRequestsQueue = [];
      setToken(null);

      // We could optionally redirect to login here
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
