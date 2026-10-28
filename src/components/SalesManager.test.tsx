
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SalesManager from "./SalesManager";
import type { Sale } from "../data/salesData";
import { createSale, deleteSale, updateSale } from "../api/salesApi";

vi.mock("../api/salesApi", () => ({
  createSale: vi.fn(),
  deleteSale: vi.fn(),
  updateSale: vi.fn(),
}));

const mockSale: Sale = {
  id: "ORD-1001",
  customer: "Amit Sharma",
  product: "Laptop",
  category: "Electronics",
  region: "South",
  date: "2026-10-20",
  amount: 50000,
  profit: 8000,
  status: "Completed",
};

const onChanged = vi.fn().mockResolvedValue(undefined);

function renderManager(sales: Sale[] = [mockSale]) {
  return render(<SalesManager sales={sales} onChanged={onChanged} />);
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Order ID/i), {
    target: { value: "ORD-2001" },
  });
  fireEvent.change(screen.getByLabelText(/Customer/i), {
    target: { value: "Priya Rao" },
  });
  fireEvent.change(screen.getByLabelText(/Product/i), {
    target: { value: "Phone" },
  });
  fireEvent.change(screen.getByLabelText(/Category/i), {
    target: { value: "Electronics" },
  });
  fireEvent.change(screen.getByLabelText(/Amount/i), {
    target: { value: "25000" },
  });
  fireEvent.change(screen.getByLabelText(/Profit/i), {
    target: { value: "5000" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  onChanged.mockResolvedValue(undefined);
  vi.mocked(createSale).mockResolvedValue(mockSale);
  vi.mocked(updateSale).mockResolvedValue(mockSale);
  vi.mocked(deleteSale).mockResolvedValue(undefined);
  vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SalesManager", () => {
  it("renders the form and existing sales records", () => {
    renderManager();

    expect(screen.getByRole("heading", { name: "Manage Sales" })).toBeInTheDocument();
    expect(screen.getByText("Database records (1)")).toBeInTheDocument();
    expect(screen.getByText("Amit Sharma")).toBeInTheDocument();
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create transaction/i })).toBeInTheDocument();
  });

  it("shows an empty state when there are no sales", () => {
    renderManager([]);

    expect(screen.getByText("Database records (0)")).toBeInTheDocument();
    expect(screen.getByText("No records in the database.")).toBeInTheDocument();
  });

  it("creates a transaction and refreshes the data", async () => {
    renderManager([]);

    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /Create transaction/i }));

    await waitFor(() => {
      expect(createSale).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "ORD-2001",
          customer: "Priya Rao",
          product: "Phone",
          category: "Electronics",
          amount: 25000,
          profit: 5000,
        })
      );
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Transaction ORD-2001 created successfully."
    );
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("shows validation error when required text fields are empty", async () => {
    renderManager([]);

    fireEvent.change(screen.getByLabelText(/Order ID/i), {
      target: { value: "ORD-2002" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText(/Profit/i), {
      target: { value: "20" },
    });

    fireEvent.change(screen.getByLabelText(/Customer/i), {
      target: { value: "   " },
    });

    fireEvent.change(screen.getByLabelText(/Product/i), {
      target: { value: "Phone" },
    });
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: "Electronics" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create transaction/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Customer, product, and category are required."
    );
    expect(createSale).not.toHaveBeenCalled();
  });

  it("shows an API error when transaction creation fails", async () => {
    vi.mocked(createSale).mockRejectedValueOnce(new Error("Duplicate order ID"));

    renderManager([]);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /Create transaction/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Duplicate order ID");
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("loads a record into the form when Edit is clicked", () => {
    renderManager();

    fireEvent.click(screen.getByRole("button", { name: "Edit ORD-1001" }));

    expect(screen.getByLabelText(/Order ID/i)).toHaveValue("ORD-1001");
    expect(screen.getByLabelText(/Customer/i)).toHaveValue("Amit Sharma");
    expect(screen.getByLabelText(/Product/i)).toHaveValue("Laptop");
    expect(screen.getByLabelText(/Amount/i)).toHaveValue(50000);
    expect(screen.getByRole("button", { name: /Save changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel edit/i })).toBeInTheDocument();
  });

  it("updates a transaction and refreshes the data", async () => {
    renderManager();

    fireEvent.click(screen.getByRole("button", { name: "Edit ORD-1001" }));

    fireEvent.change(screen.getByLabelText(/Customer/i), {
      target: { value: "Amit Updated" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));

    await waitFor(() => {
      expect(updateSale).toHaveBeenCalledWith(
        "ORD-1001",
        expect.objectContaining({
          customer: "Amit Updated",
          amount: 50000,
          profit: 8000,
        })
      );
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Transaction ORD-1001 updated successfully."
    );
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("cancels editing and resets the form", () => {
    renderManager();

    fireEvent.click(screen.getByRole("button", { name: "Edit ORD-1001" }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel edit/i }));

    expect(screen.getByRole("button", { name: /Create transaction/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Customer/i)).toHaveValue("");
  });

  it("deletes a transaction after confirmation", async () => {
    renderManager();

    fireEvent.click(screen.getByRole("button", { name: "Delete ORD-1001" }));

    await waitFor(() => {
      expect(deleteSale).toHaveBeenCalledWith("ORD-1001");
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Transaction ORD-1001 deleted successfully."
    );
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("does not delete a transaction when confirmation is declined", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));

    renderManager();

    fireEvent.click(screen.getByRole("button", { name: "Delete ORD-1001" }));

    expect(deleteSale).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("shows an API error when deletion fails", async () => {
    vi.mocked(deleteSale).mockRejectedValueOnce(new Error("Delete failed"));

    renderManager();

    fireEvent.click(screen.getByRole("button", { name: "Delete ORD-1001" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Delete failed");
    expect(onChanged).not.toHaveBeenCalled();
  });
});
