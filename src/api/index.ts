import axiosInstance from "./axiosInstance";

// Define an interface for better IntelliSense and scalability
export interface ApiServices {
  axios: typeof axiosInstance;
}

// Combine axios instance and all modular service exports
const api: ApiServices = {
  axios: axiosInstance,
};

export default api;
