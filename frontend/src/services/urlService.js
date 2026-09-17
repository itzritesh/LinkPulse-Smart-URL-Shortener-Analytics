import apiClient from "./api";

/**
 * Service to interact with the backend URL shortening endpoints
 */
export const urlService = {
  /**
   * Creates a new shortened URL
   */
  async createUrl({ original_url, custom_code, title, expires_at }) {
    const payload = {
      original_url,
      custom_code: custom_code?.trim() || null,
      title: title?.trim() || null,
      expires_at: expires_at || null,
    };
    const response = await apiClient.post("/urls", payload);
    return response.data;
  },

  /**
   * Retrieves all URLs created by the authenticated user
   */
  async getUrls(params = {}) {
    const response = await apiClient.get("/urls", { params });
    return response.data;
  },

  /**
   * Retrieves details for a specific URL owned by the authenticated user
   */
  async getUrlById(urlId) {
    const response = await apiClient.get(`/urls/${urlId}`);
    return response.data;
  },

  /**
   * Toggles the active/inactive status of a short link
   */
  async updateUrlStatus(urlId, isActive) {
    const response = await apiClient.patch(`/urls/${urlId}/status`, {
      is_active: isActive,
    });
    return response.data;
  },

  /**
   * Deletes a short link
   */
  async deleteUrl(urlId) {
    await apiClient.delete(`/urls/${urlId}`);
    return true;
  },
};
