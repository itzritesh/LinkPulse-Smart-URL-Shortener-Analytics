import axios from "axios";
import { APP_CONFIG } from "@/utils/constants";

/**
 * Production-ready Axios instance configured for LinkPulse API
 */
const apiClient = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Attach start timestamp for latency timing & Bearer token
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };

    const token = localStorage.getItem("linkpulse_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Compute round-trip latency & normalize errors
apiClient.interceptors.response.use(
  (response) => {
    if (response.config?.metadata?.startTime) {
      response.latencyMs = new Date() - response.config.metadata.startTime;
    }
    return response;
  },
  (error) => {
    // If 401 Unauthorized on protected routes, remove stale token
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("linkpulse_token");
      localStorage.removeItem("linkpulse_user");
    }

    const customError = {
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Network Error",
      status: error.response?.status,
      data: error.response?.data,
      isNetworkError: !error.response,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
