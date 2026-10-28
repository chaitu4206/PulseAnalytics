
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DollarSign } from "lucide-react";
import type { Sale } from "./data/salesData";

const mocks = vi.hoisted(() => ({
  fetchSales: vi.fn(),
  fetchAnalytics: vi.fn(),
}));

vi.mock("./api/salesApi", () => ({
  fetchSales: mocks.fetchSales,
  createSale: vi.fn(),
  updateSale: vi.fn(),
  deleteSale: vi.fn(),
}));

vi.mock("./api/analyticsApi", () => ({
  fetchAnalytics: mocks.fetchAnalytics,
}));

// Keep chart tests independent of SVG layout and browser measurements.


vi.mock("recharts", () => {
  const Stub = () => <div data-testid="recharts-stub" />;

  return {
    ResponsiveContainer: Stub,
    Bar: Stub,
    BarChart: Stub,
    CartesianGrid: Stub,
    Cell: Stub,
    Legend: Stub,
    Pie: Stub,
    PieChart: Stub,
    Tooltip: Stub,
    XAxis: Stub,
    YAxis: Stub,
    AreaChart: Stub,
    Area: Stub,
  };
});



import App from "./App";
import StatCard from "./components/StatCard";
import SalesChart from "./components/SalesChart";
import AdvancedAnalytics from "./components/AdvancedAnalytics";

const sampleSales: Sale[] = [
  {
    id: "ORD-1001",
    customer: "Amit Sharma",
    product: "Laptop",
    category: "Electronics",
    region: "South",
    date: "2026-10-20",
    amount: 50000,
    profit: 8000,
    status: "Completed",
  },
  {
    id: "ORD-1002",
    customer: "Priya Rao",
    product: "Phone",
    category: "Electronics",
    region: "North",
    date: "2026-10-19",
    amount: 20000,
    profit: 3000,
    status: "Pending",
  },
  {
    id: "ORD-1003",
    customer: "Rahul Kumar",
    product: "Tablet",
    category: "Electronics",
    region: "West",
    date: "2026-10-18",
    amount: 15000,
    profit: 2500,
    status: "Cancelled",
  },
];

const analyticsData = {
  totalRevenue: 50000,
  totalProfit: 8000,
  profitMargin: 16,
  completedOrders: 1,
  totalOrders: 3,
  statusCounts: {
    Completed: 1,
    Pending: 1,
    Cancelled: 1,
  },
  monthlyTrends: [
    { name: "Oct 2026", revenue: 50000, profit: 8000 },
  ],
  byRegion: [
    { name: "South", revenue: 50000 },
  ],
  topProducts: [
    { name: "Laptop", revenue: 50000 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchSales.mockResolvedValue(sampleSales);
  mocks.fetchAnalytics.mockResolvedValue(analyticsData);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("StatCard", () => {
  it("renders its title, value, change, and description", () => {
    render(
      <StatCard
        title="Completed Revenue"
        value="₹50,000"
        change="1 completed"
        description="of 3 orders"
        icon={DollarSign}
        color="purple"
      />
    );

    expect(screen.getByText("Completed Revenue")).toBeInTheDocument();
    expect(screen.getByText("₹50,000")).toBeInTheDocument();
    expect(screen.getByText("1 completed")).toBeInTheDocument();
    expect(screen.getByText("of 3 orders")).toBeInTheDocument();
  });

  it("applies the requested icon color class", () => {
    const { container } = render(
      <StatCard
        title="Total Orders"
        value="3"
        change="1 pending"
        description="2 other orders"
        icon={DollarSign}
        color="blue"
      />
    );

    expect(container.querySelector(".stat-icon")).toHaveClass("blue");
  });
});

describe("SalesChart", () => {
  it("renders the revenue overview for completed sales", () => {
    render(<SalesChart sales={sampleSales} />);

    expect(screen.getByRole("heading", { name: "Revenue Overview" })).toBeInTheDocument();
    expect(screen.getByText("Daily revenue and profit from completed orders")).toBeInTheDocument();
    expect(screen.getByText("Revenue", { selector: ".chart-legend span" })).toBeInTheDocument();
    expect(screen.getByText("Profit", { selector: ".chart-legend span" })).toBeInTheDocument();
  });

  it("shows an empty state when there are no completed sales", () => {
    render(
      <SalesChart
        sales={sampleSales.filter((sale) => sale.status !== "Completed")}
      />
    );

    expect(
      screen.getByText("No completed sales available for this selection.")
    ).toBeInTheDocument();
  });

  it("shows an empty state for an empty sales array", () => {
    render(<SalesChart sales={[]} />);

    expect(
      screen.getByText("No completed sales available for this selection.")
    ).toBeInTheDocument();
  });
});

describe("AdvancedAnalytics", () => {
  const props = {
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    region: "All regions",
    sales: sampleSales,
  };

  it("shows a loading message while analytics are being fetched", () => {
    mocks.fetchAnalytics.mockReturnValueOnce(new Promise(() => {}));

    render(<AdvancedAnalytics {...props} />);

    expect(screen.getByText("Loading advanced analytics...")).toBeInTheDocument();
  });

  it("renders analytics summaries after a successful request", async () => {
    render(<AdvancedAnalytics {...props} />);

    expect(await screen.findByRole("heading", { name: "Advanced Analytics" })).toBeInTheDocument();

    expect(screen.getByText("Completed revenue")).toBeInTheDocument();
    expect(screen.getByText("Completed profit")).toBeInTheDocument();
    expect(screen.getByText("Profit margin")).toBeInTheDocument();
    expect(screen.getByText("Completed orders")).toBeInTheDocument();

    expect(screen.getByText("16.00%")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("shows the selected region and date range", async () => {
    render(
      <AdvancedAnalytics
        {...props}
        region="South"
      />
    );

    expect(await screen.findByText("South · 2026-10-01 to 2026-10-31")).toBeInTheDocument();
  });

  it("shows an error and allows retrying after a failed request", async () => {
    mocks.fetchAnalytics.mockRejectedValueOnce(new Error("Analytics unavailable"));

    render(<AdvancedAnalytics {...props} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Analytics unavailable");

    mocks.fetchAnalytics.mockResolvedValueOnce(analyticsData);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Advanced Analytics" })).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.fetchAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  it("refreshes analytics when the refresh button is clicked", async () => {
    render(<AdvancedAnalytics {...props} />);

    expect(await screen.findByRole("button", { name: "Refresh analytics" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh analytics" }));

    await waitFor(() => {
      expect(mocks.fetchAnalytics).toHaveBeenCalledTimes(2);
    });
  });
});

describe("App integration", () => {
  it("loads sales and displays the Overview page", async () => {
    render(<App />);

    expect(screen.getByText("Loading sales data from the server...")).toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "Sales Overview" })).toBeInTheDocument();

    expect(mocks.fetchSales).toHaveBeenCalledTimes(1);
  });

  it("navigates through all seven pages", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Sales Overview" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Transactions/i }));
    expect(await screen.findByRole("heading", { name: "Transactions" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Products/i }));
    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Customers/i }));
    expect(await screen.findByRole("heading", { name: "Customers" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Analytics/i }));
    expect(await screen.findByRole("heading", { name: "Advanced Analytics" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Help & Support/i }));
    expect(await screen.findByRole("heading", { name: "Help & Support" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Settings/i }));
    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Overview/i }));
    expect(await screen.findByRole("heading", { name: "Sales Overview" })).toBeInTheDocument();
  });

  it("displays an API error when loading sales fails", async () => {
    mocks.fetchSales.mockRejectedValueOnce(new Error("Server unavailable"));

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Server unavailable");
    expect(screen.getByRole("button", { name: "Retry connection" })).toBeInTheDocument();
  });

  it("shows product and customer summaries", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Sales Overview" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Products/i }));
    expect(await screen.findByText("Product Summary")).toBeInTheDocument();
    expect(screen.getByText("Laptop")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Customers/i }));
    expect(await screen.findByText("Customer Summary")).toBeInTheDocument();
    expect(screen.getByText("Amit Sharma")).toBeInTheDocument();
  });

  it("displays the Help and Settings information", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Sales Overview" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Help & Support/i }));
    expect(screen.getByText(/Quick guide to using PulseAnalytics/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Settings/i }));
    expect(screen.getByText(/SQLite through the Express API/i)).toBeInTheDocument();
  });
});
