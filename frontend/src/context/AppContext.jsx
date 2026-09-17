import React, { createContext, useContext, useState, useEffect } from "react";
import { healthService } from "@/services/healthService";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [health, setHealth] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const refreshHealth = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await healthService.getHealth();
      setHealth(data);
    } catch (err) {
      setHealthError(err);
      setHealth(null);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    refreshHealth();
  }, []);

  return (
    <AppContext.Provider
      value={{
        health,
        isLoadingHealth,
        healthError,
        refreshHealth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
