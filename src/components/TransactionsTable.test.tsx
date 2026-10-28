
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TransactionsTable from "./TransactionsTable";
import type { Sale } from "../data/salesData";

const makeSale = (
  id: string,
  customer: string,
  date: string,
  status: Sale["status"] = "Completed",
  amount = 1000,
): Sale => ({
  id,
  customer,
  product: "Laptop",
  category: "Electronics",
  region: "South",
  date,
  amount,
  profit: 200,
  status,
});

const sales: Sale[] = [
  makeSale("ORD-1001", "Amit Sharma", "2026-10-20", "Completed", 5000),
  makeSale("ORD-1002", "Priya Rao", "2026-10-19", "Pending", 3000),
  makeSale("ORD-1003", "Rahul Kumar", "2026-10-18", "Cancelled", 2000),
  makeSale("ORD-1004", "Neha Singh", "2026-10-17", "Completed", 4000),
  makeSale("ORD-1005", "Kiran Patel", "2026-10-16", "Pending", 1500),
  makeSale("ORD-1006", "Sneha Reddy", "2026-10-15", "Completed", 6000),
  makeSale("ORD-1007", "Arjun Rao", "2026-10-14", "Completed", 2500),
];

function renderTable(initialSales: Sale[] = sales) {
  const onSearchChange = vi.fn();
  const onStatusChange = vi.fn();

  const result = render(
    <TransactionsTable
      sales={initialSales}
      search=""
      onSearchChange={onSearchChange}
      status="All statuses"
      onStatusChange={onStatusChange}
    />
  );

  return { ...result, onSearchChange, onStatusChange };
}

afterEach(() => {
  cleanup();
});

describe("TransactionsTable", () => {
  
it("renders the heading and transaction data", () => {
  renderTable();

  expect(
    screen.getByRole("heading", { name: "Recent Transactions" })
  ).toBeInTheDocument();

  expect(screen.getByText("ORD-1001")).toBeInTheDocument();
  expect(screen.getByText("Amit Sharma")).toBeInTheDocument();
  expect(screen.getAllByText("Laptop")).toHaveLength(5);
  expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
});


  it("shows five records on the first page", () => {
    renderTable();

    expect(screen.getByText("Showing 1–5 of 7 records")).toBeInTheDocument();
    expect(screen.getByText("ORD-1001")).toBeInTheDocument();
    expect(screen.getByText("ORD-1005")).toBeInTheDocument();
    expect(screen.queryByText("ORD-1006")).not.toBeInTheDocument();
  });

  it("moves to the next page and back", () => {
    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByText("Showing 6–7 of 7 records")).toBeInTheDocument();
    expect(screen.getByText("ORD-1006")).toBeInTheDocument();
    expect(screen.getByText("ORD-1007")).toBeInTheDocument();
    expect(screen.queryByText("ORD-1001")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));

    expect(screen.getByText("Showing 1–5 of 7 records")).toBeInTheDocument();
    expect(screen.getByText("ORD-1001")).toBeInTheDocument();
  });

  it("disables pagination buttons when appropriate", () => {
    renderTable();

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
  });

  it("calls onSearchChange when the search input changes", () => {
    const { onSearchChange } = renderTable();

    fireEvent.change(screen.getByRole("textbox", { name: "Search transactions" }), {
      target: { value: "Amit" },
    });

    expect(onSearchChange).toHaveBeenCalledWith("Amit");
  });

  it("calls onStatusChange when the status filter changes", () => {
    const { onStatusChange } = renderTable();

    fireEvent.change(screen.getByRole("combobox", { name: "Filter by status" }), {
      target: { value: "Pending" },
    });

    expect(onStatusChange).toHaveBeenCalledWith("Pending");
  });

  
it("sorts by customer when the customer header is clicked", () => {
  renderTable();

  fireEvent.click(
    screen.getByRole("button", { name: "Sort by CUSTOMER" })
  );

  const rows = screen.getAllByRole("row");
  const displayedCustomers = rows
    .slice(1, 6)
    .map((row) => row.querySelectorAll("td")[1]?.textContent);

  expect(displayedCustomers).toEqual([
    "Amit Sharma",
    "Arjun Rao",
    "Kiran Patel",
    "Neha Singh",
    "Priya Rao",
  ]);
});


  it("toggles the sort direction when the same header is clicked twice", () => {
    renderTable();

    const customerSort = screen.getByRole("button", { name: "Sort by CUSTOMER" });

    fireEvent.click(customerSort);
    expect(customerSort).toHaveTextContent("↑");

    fireEvent.click(customerSort);
    expect(customerSort).toHaveTextContent("↓");
  });

  it("shows an empty state when no transactions match", () => {
    renderTable([]);

    expect(
      screen.getByText("No transactions match your filters.")
    ).toBeInTheDocument();
    expect(screen.getByText("No records")).toBeInTheDocument();
  });

  it("renders the supplied status filter value", () => {
    const onSearchChange = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TransactionsTable
        sales={sales}
        search=""
        onSearchChange={onSearchChange}
        status="Pending"
        onStatusChange={onStatusChange}
      />
    );

    expect(screen.getByRole("combobox", { name: "Filter by status" })).toHaveValue("Pending");
  });
});
