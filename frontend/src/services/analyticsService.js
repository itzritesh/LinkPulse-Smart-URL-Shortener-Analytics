import apiClient from "./api";

/**
 * Service to interact with the LinkPulse Analytics API suite
 */
export const analyticsService = {
  /**
   * Comprehensive analytics summary for a short link
   * @param {number|string} urlId - Link ID
   * @param {Object} params - Query params (period: 'today'|'7d'|'30d'|'custom', start_date, end_date)
   */
  async getUrlAnalytics(urlId, params = {}) {
    const response = await apiClient.get(`/analytics/${urlId}`, { params });
    return response.data;
  },

  /**
   * KPIs and paginated click events log (privacy-safe, no raw IPs)
   * @param {number|string} urlId - Link ID
   * @param {Object} params - Query params (period, start_date, end_date, page, limit)
   */
  async getUrlClicks(urlId, params = {}) {
    const response = await apiClient.get(`/analytics/${urlId}/clicks`, { params });
    return response.data;
  },

  /**
   * Device, browser, and operating system breakdown
   * @param {number|string} urlId - Link ID
   * @param {Object} params - Query params (period, start_date, end_date)
   */
  async getUrlDevices(urlId, params = {}) {
    const response = await apiClient.get(`/analytics/${urlId}/devices`, { params });
    return response.data;
  },

  /**
   * Referral source distribution
   * @param {number|string} urlId - Link ID
   * @param {Object} params - Query params (period, start_date, end_date)
   */
  async getUrlReferrals(urlId, params = {}) {
    const response = await apiClient.get(`/analytics/${urlId}/referrals`, { params });
    return response.data;
  },

  /**
   * Geographic breakdown (country, region/state, city)
   * @param {number|string} urlId - Link ID
   * @param {Object} params - Query params (period, start_date, end_date)
   */
  async getUrlLocations(urlId, params = {}) {
    const response = await apiClient.get(`/analytics/${urlId}/locations`, { params });
    return response.data;
  },

  /**
   * Click timeline time-series and peak velocity metrics
   * @param {number|string} urlId - Link ID
   * @param {Object} params - Query params (period, start_date, end_date)
   */
  async getUrlTimeline(urlId, params = {}) {
    const response = await apiClient.get(`/analytics/${urlId}/timeline`, { params });
    return response.data;
  },

  /**
   * Account-wide aggregate metrics across all user short links
   * @param {Object} params - Query params (days)
   */
  async getOverviewAnalytics(params = {}) {
    const response = await apiClient.get("/analytics/overview", { params });
    return response.data;
  },

  /**
   * Latest click events across all short links owned by authenticated user
   * @param {Object} params - Query params (limit)
   */
  async getRecentClicks(params = { limit: 10 }) {
    const response = await apiClient.get("/analytics/recent-clicks", { params });
    return response.data;
  },

  /**
   * Top converting short links ordered by click count
   * @param {Object} params - Query params (limit)
   */
  async getTopLinks(params = { limit: 5 }) {
    const response = await apiClient.get("/analytics/top-links", { params });
    return response.data;
  },

  /**
   * Multi-criteria filtered analytics with period comparison and breakdowns
   * @param {Object} params - { period, start_date, end_date, url_id, device, country, region, referrer, compare, page, limit }
   */
  async getFilteredAnalytics(params = {}) {
    const response = await apiClient.get("/analytics/filter", { params });
    return response.data;
  },

  /**
   * Distinct available filter choices (devices, countries, regions, referrers, urls)
   */
  async getFilterOptions() {
    const response = await apiClient.get("/analytics/filter-options");
    return response.data;
  },

  /**
   * Triggers file download of the filtered dataset (CSV or JSON)
   * @param {Object} params - Active filter parameters
   * @param {string} format - 'csv' or 'json'
   */
  async exportFilteredAnalytics(params = {}, format = "csv") {
    const response = await apiClient.get("/analytics/export", {
      params: { ...params, format },
      responseType: format === "csv" ? "blob" : "json",
    });

    if (format === "csv") {
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `linkpulse_analytics_${params.period || "export"}_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { status: "success", format: "csv" };
    }

    // JSON export download
    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `linkpulse_analytics_${params.period || "export"}_${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { status: "success", format: "json" };
  },
};

