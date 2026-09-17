import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import { AuthContext } from "@/context/AuthContext";
import { ToastContext } from "@/context/ToastContext";

// Mock toast and auth context providers
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/login", state: null }),
  };
});

const renderWithContext = (ui, authValue) => {
  return render(
    <BrowserRouter>
      <ToastContext.Provider value={mockToast}>
        <AuthContext.Provider value={authValue}>
          {ui}
        </AuthContext.Provider>
      </ToastContext.Provider>
    </BrowserRouter>
  );
};

describe("Authentication Form Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LoginPage Component", () => {
    it("renders email, password inputs and sign-in button", () => {
      renderWithContext(<LoginPage />, {
        isAuthenticated: false,
        login: vi.fn(),
      });

      expect(screen.getByPlaceholderText(/you@company\.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("displays error message if submitted with empty credentials", async () => {
      renderWithContext(<LoginPage />, {
        isAuthenticated: false,
        login: vi.fn(),
      });

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      const form = submitButton.closest("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/please provide both email and password/i)).toBeInTheDocument();
      });
    });

    it("toggles password visibility when clicking eye button", () => {
      renderWithContext(<LoginPage />, {
        isAuthenticated: false,
        login: vi.fn(),
      });

      const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButton = screen.getByLabelText(/show password/i);
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      const hideButton = screen.getByLabelText(/hide password/i);
      fireEvent.click(hideButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("calls login function and redirects upon valid credentials", async () => {
      const mockLogin = vi.fn().mockResolvedValue({ id: "1", name: "Alex" });
      renderWithContext(<LoginPage />, {
        isAuthenticated: false,
        login: mockLogin,
      });

      const emailInput = screen.getByPlaceholderText(/you@company\.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: "alex@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("alex@example.com", "SecurePass123!");
        expect(mockToast.success).toHaveBeenCalledWith("Welcome back, Alex!");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });

    it("displays error alert when login fails", async () => {
      const mockLogin = vi.fn().mockRejectedValue(new Error("Invalid email or password"));
      renderWithContext(<LoginPage />, {
        isAuthenticated: false,
        login: mockLogin,
      });

      const emailInput = screen.getByPlaceholderText(/you@company\.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "WrongPass123!" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
        expect(mockToast.error).toHaveBeenCalledWith("Invalid email or password");
      });
    });
  });

  describe("RegisterPage Component", () => {
    it("renders name, email, password, and confirm password fields", () => {
      renderWithContext(<RegisterPage />, {
        isAuthenticated: false,
        register: vi.fn(),
      });

      expect(screen.getByPlaceholderText(/alex rivers/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/alex@company\.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/minimum 8 characters/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/re-enter password/i)).toBeInTheDocument();
    });

    it("enforces validation for short names and weak passwords", async () => {
      renderWithContext(<RegisterPage />, {
        isAuthenticated: false,
        register: vi.fn(),
      });

      const nameInput = screen.getByPlaceholderText(/alex rivers/i);
      const emailInput = screen.getByPlaceholderText(/alex@company\.com/i);
      const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);
      const confirmInput = screen.getByPlaceholderText(/re-enter password/i);
      const submitButton = screen.getByRole("button", { name: /create free account/i });
      const form = submitButton.closest("form");

      fireEvent.change(nameInput, { target: { value: "A" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "ValidPass123!" } });
      fireEvent.change(confirmInput, { target: { value: "ValidPass123!" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/name must contain at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it("displays error when passwords do not match", async () => {
      renderWithContext(<RegisterPage />, {
        isAuthenticated: false,
        register: vi.fn(),
      });

      fireEvent.change(screen.getByPlaceholderText(/alex rivers/i), { target: { value: "Alex Rivers" } });
      fireEvent.change(screen.getByPlaceholderText(/alex@company\.com/i), { target: { value: "alex@example.com" } });
      fireEvent.change(screen.getByPlaceholderText(/minimum 8 characters/i), { target: { value: "StrongPass123!" } });
      fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: "MismatchPass123!" } });

      const submitButton = screen.getByRole("button", { name: /create free account/i });
      const form = submitButton.closest("form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it("submits successfully when password meets complexity and matches", async () => {
      const mockRegister = vi.fn().mockResolvedValue({ id: "2", name: "Alex Rivers" });
      renderWithContext(<RegisterPage />, {
        isAuthenticated: false,
        register: mockRegister,
      });

      fireEvent.change(screen.getByPlaceholderText(/alex rivers/i), { target: { value: "Alex Rivers" } });
      fireEvent.change(screen.getByPlaceholderText(/alex@company\.com/i), { target: { value: "alex@example.com" } });
      fireEvent.change(screen.getByPlaceholderText(/minimum 8 characters/i), { target: { value: "StrongPass123!" } });
      fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: "StrongPass123!" } });

      const submitButton = screen.getByRole("button", { name: /create free account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith("Alex Rivers", "alex@example.com", "StrongPass123!");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });
  });
});
