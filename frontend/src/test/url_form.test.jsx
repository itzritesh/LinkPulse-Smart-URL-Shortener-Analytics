import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UrlForm from "@/components/urls/UrlForm";
import { urlService } from "@/services/urlService";
import { ToastContext } from "@/context/ToastContext";

vi.mock("@/services/urlService", () => ({
  urlService: {
    createUrl: vi.fn(),
  },
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

const renderUrlForm = (onLinkCreated = vi.fn()) => {
  return render(
    <ToastContext.Provider value={mockToast}>
      <UrlForm onLinkCreated={onLinkCreated} />
    </ToastContext.Provider>
  );
};

describe("UrlForm Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders destination URL input and submit button", () => {
    renderUrlForm();
    expect(screen.getByPlaceholderText(/paste long destination url/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /shorten url/i })).toBeInTheDocument();
  });

  it("rejects empty URL submission with an error banner", async () => {
    renderUrlForm();
    const submitBtn = screen.getByRole("button", { name: /shorten url/i });
    const form = submitBtn.closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/please paste a destination url/i)).toBeInTheDocument();
    });
  });

  it("rejects dangerous URL schemes such as javascript:, data:, and file:", async () => {
    renderUrlForm();
    const urlInput = screen.getByPlaceholderText(/paste long destination url/i);
    const submitBtn = screen.getByRole("button", { name: /shorten url/i });
    const form = submitBtn.closest("form");

    // Test javascript:
    fireEvent.change(urlInput, { target: { value: "javascript:alert('XSS')" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/unsafe url protocol/i)).toBeInTheDocument();
    });

    // Test data:
    fireEvent.change(urlInput, { target: { value: "data:text/html,<script>alert(1)</script>" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/unsafe url protocol/i)).toBeInTheDocument();
    });
  });

  it("rejects internal and loopback IP destinations (SSRF protection)", async () => {
    renderUrlForm();
    const urlInput = screen.getByPlaceholderText(/paste long destination url/i);
    const submitBtn = screen.getByRole("button", { name: /shorten url/i });
    const form = submitBtn.closest("form");

    // Test localhost
    fireEvent.change(urlInput, { target: { value: "http://localhost:8080/admin" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/private or internal address/i)).toBeInTheDocument();
    });

    // Test 127.0.0.1
    fireEvent.change(urlInput, { target: { value: "http://127.0.0.1:9000/keys" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/private or internal address/i)).toBeInTheDocument();
    });
  });

  it("submits valid HTTPS URL, calls urlService, and displays created link banner", async () => {
    const mockCreated = {
      id: "url-123",
      short_code: "launch24",
      short_url: "http://localhost:8000/launch24",
      original_url: "https://example.com/product/launch",
      title: "Product Launch",
      clicks_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    urlService.createUrl.mockResolvedValueOnce(mockCreated);
    const mockOnCreated = vi.fn();
    renderUrlForm(mockOnCreated);

    const urlInput = screen.getByPlaceholderText(/paste long destination url/i);
    fireEvent.change(urlInput, { target: { value: "https://example.com/product/launch" } });

    const submitBtn = screen.getByRole("button", { name: /shorten url/i });
    const form = submitBtn.closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(urlService.createUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          original_url: "https://example.com/product/launch",
        })
      );
      expect(mockOnCreated).toHaveBeenCalledWith(mockCreated);
      expect(mockToast.success).toHaveBeenCalledWith("Short URL generated successfully!");
      expect(screen.getByText(/active short link/i)).toBeInTheDocument();
      expect(screen.getByText(/launch24/)).toBeInTheDocument();
    });
  });
});
