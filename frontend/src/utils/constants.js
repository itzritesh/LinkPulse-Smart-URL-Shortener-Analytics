/**
 * Application constants for LinkPulse
 */
export const APP_CONFIG = {
  NAME: "LinkPulse",
  TAGLINE: "Smart URL Shortener & Analytics SaaS",
  VERSION: "1.0.0",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
};

export const ROUTES = {
  HOME: "/",
  HEALTH: "/health",
  ANALYTICS: "/analytics",
};
