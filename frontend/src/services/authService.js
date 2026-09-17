import apiClient from "./api";

/**
 * Service to interact with the backend authentication endpoints
 */
export const authService = {
  /**
   * Registers a new user account
   */
  async register({ name, email, password }) {
    const response = await apiClient.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Authenticates an existing user
   */
  async login({ email, password }) {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Fetches the current authenticated user profile
   */
  async getMe() {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },
};
