import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthContext } from "@/context/AuthContext";

describe("ProtectedRoute Component Tests", () => {
  const renderProtectedRoute = (authValue, initialEntry = "/dashboard") => {
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<div>Login Page Screen</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it("shows loading spinner when authentication state is loading", () => {
    renderProtectedRoute({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    expect(screen.getByText(/authenticating session/i)).toBeInTheDocument();
    expect(screen.queryByText(/secret dashboard content/i)).not.toBeInTheDocument();
  });

  it("redirects unauthenticated visitor to /login", () => {
    renderProtectedRoute({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    expect(screen.getByText("Login Page Screen")).toBeInTheDocument();
    expect(screen.queryByText(/secret dashboard content/i)).not.toBeInTheDocument();
  });

  it("renders protected children when visitor is authenticated", () => {
    renderProtectedRoute({
      isAuthenticated: true,
      isLoading: false,
      user: { id: "1", name: "Alex" },
    });

    expect(screen.getByText("Secret Dashboard Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page Screen")).not.toBeInTheDocument();
  });
});
