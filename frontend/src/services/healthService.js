import apiClient from "./api";

/**
 * Service to interact with the backend health endpoint
 */
export const healthService = {
  /**
   * Fetches backend health and database connectivity status
   */
  async getHealth() {
    const response = await apiClient.get("/health");
    return {
      ...response.data,
      clientLatencyMs: response.latencyMs || 0,
    };
  },
};
