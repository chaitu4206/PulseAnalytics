
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  it("renders all seven navigation options", () => {
    render(
      <Sidebar
        activePage="Overview"
        onNavigate={vi.fn()}
        transactionCount={15}
      />
    );

    expect(
      screen.getByRole("button", { name: /Overview/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Transactions/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Products/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Customers/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Analytics/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Help & Support/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Settings/i })
    ).toBeInTheDocument();
  });

  it("highlights the active page", () => {
    render(
      <Sidebar
        activePage="Analytics"
        onNavigate={vi.fn()}
        transactionCount={15}
      />
    );

    expect(
      screen.getByRole("button", { name: /Analytics/i })
    ).toHaveAttribute("aria-current", "page");

    expect(
      screen.getByRole("button", { name: /Overview/i })
    ).not.toHaveAttribute("aria-current", "page");
  });

  it("calls onNavigate when a page is clicked", () => {
    const onNavigate = vi.fn();

    render(
      <Sidebar
        activePage="Overview"
        onNavigate={onNavigate}
        transactionCount={15}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Transactions/i })
    );

    expect(onNavigate).toHaveBeenCalledWith("Transactions");
  });

  it("displays the current transaction count", () => {
    render(
      <Sidebar
        activePage="Overview"
        onNavigate={vi.fn()}
        transactionCount={23}
      />
    );

    expect(
      screen.getByRole("button", { name: /Transactions/i })
    ).toHaveTextContent("23");
  });
});
