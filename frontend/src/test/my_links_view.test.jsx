import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MyLinksView from "@/components/dashboard/MyLinksView";
import { ToastContext } from "@/context/ToastContext";

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

const renderMyLinks = (ui) => {
  return render(
    <ToastContext.Provider value={mockToast}>
      {ui}
    </ToastContext.Provider>
  );
};

describe("MyLinksView Component Tests", () => {
  const sampleUrls = [
    {
      id: "1",
      short_code: "docs24",
      original_url: "https://example.com/documentation",
      title: "API Documentation",
      clicks: 142,
      is_active: true,
      is_expired: false,
      created_at: "2026-09-01T10:00:00Z",
    },
    {
      id: "2",
      short_code: "blog99",
      original_url: "https://example.com/blog/announcement",
      title: "Company Blog",
      clicks: 580,
      is_active: false,
      is_expired: false,
      created_at: "2026-09-10T12:00:00Z",
    },
    {
      id: "3",
      short_code: "promo50",
      original_url: "https://store.com/promo-code",
      title: "Spring Promo",
      clicks: 35,
      is_active: true,
      is_expired: false,
      created_at: "2026-08-20T08:00:00Z",
    },
  ];

  it("renders empty state when urls array is empty", () => {
    const onOpenCreate = vi.fn();
    renderMyLinks(
      <MyLinksView
        urls={[]}
        isLoading={false}
        onOpenCreateModal={onOpenCreate}
      />
    );

    expect(screen.getByText(/no links created yet/i)).toBeInTheDocument();
    const createBtn = screen.getByRole("button", { name: /create your first link/i });
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(onOpenCreate).toHaveBeenCalled();
  });

  it("renders list of URLs when data is present", () => {
    renderMyLinks(
      <MyLinksView
        urls={sampleUrls}
        isLoading={false}
      />
    );

    expect(screen.getAllByText("API Documentation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Company Blog").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Spring Promo").length).toBeGreaterThan(0);
  });

  it("filters URLs by search query", () => {
    renderMyLinks(
      <MyLinksView
        urls={sampleUrls}
        isLoading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by vanity code/i);
    fireEvent.change(searchInput, { target: { value: "blog" } });

    expect(screen.getAllByText("Company Blog").length).toBeGreaterThan(0);
    expect(screen.queryByText("API Documentation")).not.toBeInTheDocument();
    expect(screen.queryByText("Spring Promo")).not.toBeInTheDocument();
  });

  it("filters URLs by active status", () => {
    renderMyLinks(
      <MyLinksView
        urls={sampleUrls}
        isLoading={false}
      />
    );

    const activeFilterBtn = screen.getByRole("button", { name: /^active$/i });
    fireEvent.click(activeFilterBtn);

    expect(screen.getAllByText("API Documentation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Spring Promo").length).toBeGreaterThan(0);
    expect(screen.queryByText("Company Blog")).not.toBeInTheDocument();
  });

  it("sorts URLs by click count", () => {
    renderMyLinks(
      <MyLinksView
        urls={sampleUrls}
        isLoading={false}
      />
    );

    const sortSelect = screen.getByDisplayValue(/created: newest first/i);
    fireEvent.change(sortSelect, { target: { value: "clicks_desc" } });

    const rows = screen.getAllByRole("row");
    // Row 0 is the table header, row 1 should be the highest clicked item (580 clicks)
    expect(rows[1]).toHaveTextContent("Company Blog");
  });

  it("triggers delete confirmation modal when delete button is clicked", () => {
    const onDeleteMock = vi.fn();
    renderMyLinks(
      <MyLinksView
        urls={sampleUrls}
        isLoading={false}
        onDeleteUrl={onDeleteMock}
      />
    );

    const deleteButtons = screen.getAllByTitle(/delete link/i);
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/permanently remove this link\?/i)).toBeInTheDocument();
  });
});
