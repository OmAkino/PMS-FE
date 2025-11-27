export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message?: string;
  statusCode?: number;
}

// Extend AxiosRequestConfig to support custom properties like `_retry`
declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}
