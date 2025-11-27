import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";
import { TokenStorage } from "./tokenStorage";
import type { ApiError, RefreshResponse } from "@/types/api.types";

const BASE_URL = import.meta.env.VITE_API_URL as string;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ----- Refresh Token Handling -----
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string): void => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// ----- Request Interceptor -----
axiosInstance.interceptors.request.use(
  (config): any => {
    const accessToken = TokenStorage.getAccessToken();
    const user = TokenStorage.getUser();

    // Ensure headers always exist and are mutable
    config.headers = config.headers || {};

    if (accessToken && !config.headers["Authorization"]) {
      (config.headers as any)["Authorization"] = `Bearer ${accessToken}`;
    }

    //  Safely add userId to request
    if (user && typeof user["id"] === "number") {
      const userId = user["id"];
      const method = config.method?.toLowerCase();

      if (["post", "put", "patch"].includes(method || "")) {
        config.data = { ...(config.data || {}), userId };
      } else if (method === "get") {
        config.params = { ...(config.params || {}), userId };
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ----- Response Interceptor -----
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.data?.message === "jwt expired" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest.headers)
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = TokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token available");

        const response = await axios.post<RefreshResponse>(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        TokenStorage.setAccessToken(accessToken);
        TokenStorage.setRefreshToken(newRefreshToken);

        onTokenRefreshed(accessToken);

        if (originalRequest.headers)
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        toast.error("Session expired. Please log in again.");
        TokenStorage.clearTokens();
        refreshSubscribers = [];
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      TokenStorage.clearTokens();
      window.location.href = "/";
    }

    if (error.response) {
      const message = error.response.data?.message || "Something went wrong!";
      toast.error(message);
    } else {
      toast.error("Network error. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
