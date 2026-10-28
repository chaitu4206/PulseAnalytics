
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Download,
  CalendarDays,
  Bell,
  Filter,
  RotateCcw,
} from "lucide-react";

import Sidebar, { type Page } from "./components/Sidebar";
import StatCard from "./components/StatCard";
import SalesChart from "./components/SalesChart";
import TransactionsTable from "./components/TransactionsTable";

import {
  formatINR,
  getDashboardMetrics,
} from "./data/salesData";

import type { Sale } from "./data/salesData";
import { fetchSales } from "./api/salesApi";

import "./App.css";

const AdvancedAnalytics = lazy(
  () => import("./components/AdvancedAnalytics")
);

const SalesManager = lazy(
  () => import("./components/SalesManager")
);

type RegionFilter = "All regions" | Sale["region"];
type StatusFilter = "All statuses" | Sale["status"];

const DEFAULT_START_DATE = "2026-10-01";
const DEFAULT_END_DATE = "2026-10-31";

function App() {
  // Backend data and request state
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Dashboard filters
  const [region, setRegion] =
    useState<RegionFilter>("All regions");
  const [startDate, setStartDate] =
    useState(DEFAULT_START_DATE);
  const [endDate, setEndDate] =
    useState(DEFAULT_END_DATE);
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<StatusFilter>("All statuses");
  const [activePage, setActivePage] = useState<Page>("Overview");

  // Fetch sales from the Express backend.
  // Prevent state updates if the component unmounts mid-request.
  const loadSales = async (
    isActive: () => boolean = () => true
  ) => {
    if (isActive()) {
      setLoading(true);
      setApiError("");
    }

    try {
      const data = await fetchSales();

      if (isActive()) {
        // Default missing or invalid profit values to zero.
        const normalizedData = data.map((sale) => ({
          ...sale,
          profit:
            typeof sale.profit === "number" &&
            Number.isFinite(sale.profit)
              ? sale.profit
              : 0,
        }));

        setSalesData(normalizedData);
      }
    } catch (error) {
      if (isActive()) {
        setApiError(
          error instanceof Error
            ? error.message
            : "Unable to connect to the sales API."
        );
      }
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    void loadSales(() => !cancelled);

    return () => {
      cancelled = true;
    };
  }, []);

  // Reset all filters
  const resetFilters = () => {
    setRegion("All regions");
    setStartDate(DEFAULT_START_DATE);
    setEndDate(DEFAULT_END_DATE);
    setSearch("");
    setStatus("All statuses");
  };

  // Filter sales by date and region
  const filteredSales = useMemo(
    () =>
      salesData.filter((sale) => {
        const matchesRegion =
          region === "All regions" ||
          sale.region === region;

        const matchesDate =
          sale.date >= startDate &&
          sale.date <= endDate;

        return matchesRegion && matchesDate;
      }),
    [salesData, region, startDate, endDate]
  );

  // Apply table search and status filters for CSV export
  const exportSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    return filteredSales.filter((sale) => {
      const matchesSearch = [
        sale.id,
        sale.customer,
        sale.product,
        sale.category,
        sale.region,
      ].some((value) =>
        value.toLowerCase().includes(query)
      );

      const matchesStatus =
        status === "All statuses" ||
        sale.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [filteredSales, search, status]);

  // Dashboard metrics
  const metrics = useMemo(
    () => getDashboardMetrics(filteredSales),
    [filteredSales]
  );

  // Revenue grouped by category
  const categories = useMemo(() => {
    const totals = new Map<string, number>();

    filteredSales
      .filter((sale) => sale.status === "Completed")
      .forEach((sale) => {
        totals.set(
          sale.category,
          (totals.get(sale.category) ?? 0) + sale.amount
        );
      });

    const colors = [
      "#635bff",
      "#20b99a",
      "#f5a742",
      "#ee7297",
      "#3286ed",
    ];

    return Array.from(
      totals,
      ([name, revenue], index) => ({
        name,
        revenue,
        color: colors[index % colors.length],
      })
    ).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  const totalCategoryRevenue = categories.reduce(
    (sum, category) => sum + category.revenue,
    0
  );

  // Export currently filtered table records as CSV
  const exportReport = () => {
    const headers = [
      "Order ID",
      "Customer",
      "Product",
      "Category",
      "Region",
      "Date",
      "Amount",
      "Profit",
      "Status",
    ];

    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = exportSales.map((sale) =>
      [
        sale.id,
        sale.customer,
        sale.product,
        sale.category,
        sale.region,
        sale.date,
        sale.amount,
        sale.profit,
        sale.status,
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows,
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "pulseanalytics-sales-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        transactionCount={salesData.length}
      />

      <main className="main-content">
        {loading ? (
          <section
            className="panel empty-state"
            aria-live="polite"
          >
            Loading sales data from the server...
          </section>
        ) : apiError ? (
          <section className="panel empty-state" role="alert">
            <h3>Unable to load sales data</h3>
            <p>{apiError}</p>
            <button
              className="export-button"
              type="button"
              onClick={() => void loadSales()}
            >
              Retry connection
            </button>
          </section>
        ) : activePage === "Overview" ? (
          <>
            <header className="topbar">
              <div>
                <div className="breadcrumb">
                  Workspace / <strong>Overview</strong>
                </div>
                <h1>Sales Overview</h1>
                <p className="page-subtitle">
                  Explore sales performance using your dataset.
                </p>
              </div>

              <div className="topbar-actions">
                <label className="date-button">
                  <span>From</span>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                    aria-label="Start date"
                    style={{
                      width: 115,
                      border: 0,
                      background: "transparent",
                    }}
                  />
                </label>

                <label className="date-button">
                  <span>To</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                    aria-label="End date"
                    style={{
                      width: 115,
                      border: 0,
                      background: "transparent",
                    }}
                  />
                </label>

                <label className="date-button">
                  <Filter size={16} />
                  <select
                    value={region}
                    onChange={(event) =>
                      setRegion(
                        event.target.value as RegionFilter
                      )
                    }
                    aria-label="Filter by region"
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "inherit",
                      outline: 0,
                    }}
                  >
                    <option>All regions</option>
                    <option>North</option>
                    <option>South</option>
                    <option>East</option>
                    <option>West</option>
                  </select>
                </label>

                <button
                  className="date-button"
                  type="button"
                  onClick={resetFilters}
                  title="Reset all filters"
                >
                  <RotateCcw size={15} />
                  Reset
                </button>

                <button
                  className="notification-button"
                  type="button"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                </button>

                <button
                  className="export-button"
                  type="button"
                  onClick={exportReport}
                >
                  <Download size={17} />
                  Export CSV ({exportSales.length})
                </button>
              </div>
            </header>

            <section className="stats-grid">
              <StatCard
                title="Completed Revenue"
                value={formatINR(metrics.revenue)}
                change={`${metrics.completedOrders} completed`}
                description={`of ${metrics.orders} orders`}
                icon={DollarSign}
                color="purple"
              />

              <StatCard
                title="Total Orders"
                value={metrics.orders.toLocaleString("en-IN")}
                change={`${metrics.pendingOrders} pending`}
                description={`${metrics.cancelledOrders} cancelled`}
                icon={ShoppingBag}
                color="blue"
              />

              <StatCard
                title="Completed Profit"
                value={formatINR(metrics.profit)}
                change="From completed"
                description="orders only"
                icon={TrendingUp}
                color="green"
              />

              <StatCard
                title="Unique Customers"
                value={metrics.customers.toLocaleString("en-IN")}
                change="In selected region"
                description={`Avg. order ${formatINR(
                  metrics.averageOrderValue
                )}`}
                icon={Users}
                color="orange"
              />
            </section>

            <div className="charts-grid">
              <SalesChart sales={filteredSales} />

              <section className="panel performance-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Sales by Category</h3>
                    <p>Completed order revenue</p>
                  </div>
                </div>

                {categories.length === 0 ? (
                  <p className="empty-state">
                    No completed sales for the selected
                    region and date range.
                  </p>
                ) : (
                  categories.map((category) => {
                    const share =
                      totalCategoryRevenue > 0
                        ? (category.revenue /
                            totalCategoryRevenue) *
                          100
                        : 0;

                    return (
                      <div
                        className="category-row"
                        key={category.name}
                      >
                        <div className="category-info">
                          <span>
                            <i
                              style={{
                                background: category.color,
                              }}
                            />
                            {category.name}
                          </span>
                          <strong>
                            {formatINR(category.revenue)}
                          </strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${share}%`,
                              background: category.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="performance-footer">
                  <span>
                    <TrendingUp size={15} />
                    Top category
                  </span>
                  <strong>
                    {categories[0]?.name ?? "No data"}
                  </strong>
                </div>
              </section>
            </div>

            <TransactionsTable
              sales={filteredSales}
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
            />

            <footer className="dashboard-footer">
              <span>
                © 2026 PulseAnalytics · Sales Intelligence
              </span>
              <span>
                <CalendarDays size={14} />
                Live API data · Demo project
              </span>
            </footer>
          </>
        ) : activePage === "Transactions" ? (
          <>
            <header className="topbar">
              <div>
                <div className="breadcrumb">
                  Workspace / <strong>Transactions</strong>
                </div>
                <h1>Transactions</h1>
                <p className="page-subtitle">
                  Search, filter, and manage your sales records.
                </p>
              </div>
            </header>

            <TransactionsTable
              sales={filteredSales}
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
            />

            <Suspense
              fallback={
                <section
                  className="panel empty-state"
                  aria-live="polite"
                >
                  Loading sales management...
                </section>
              }
            >
              <SalesManager
                sales={salesData}
                onChanged={loadSales}
              />
            </Suspense>
          </>
        ) : activePage === "Analytics" ? (
          <>
            <header className="topbar">
              <div>
                <div className="breadcrumb">
                  Workspace / <strong>Analytics</strong>
                </div>
                <h1>Advanced Analytics</h1>
                <p className="page-subtitle">
                  Explore trends, regions, products, and order statuses.
                </p>
              </div>
            </header>

            <Suspense
              fallback={
                <section
                  className="panel empty-state"
                  aria-live="polite"
                >
                  Loading analytics...
                </section>
              }
            >
              <AdvancedAnalytics
                startDate={startDate}
                endDate={endDate}
                region={region}
                sales={salesData}
              />
            </Suspense>
          </>
        ) : activePage === "Products" ? (
          <>
            <header className="topbar">
              <div>
                <div className="breadcrumb">
                  Workspace / <strong>Products</strong>
                </div>
                <h1>Products</h1>
                <p className="page-subtitle">
                  Product performance based on your sales records.
                </p>
              </div>
            </header>

            <section className="panel">
              <div className="panel-heading">
                <h3>Product Summary</h3>
              </div>

              {Array.from(
                salesData.reduce((map, sale) => {
                  const item = map.get(sale.product) ?? {
                    orders: 0,
                    revenue: 0,
                  };
                  item.orders += 1;
                  if (sale.status === "Completed") {
                    item.revenue += sale.amount;
                  }
                  map.set(sale.product, item);
                  return map;
                }, new Map<string, { orders: number; revenue: number }>())
              )
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([product, info]) => (
                  <div className="category-row" key={product}>
                    <div className="category-info">
                      <span>{product}</span>
                      <strong>{formatINR(info.revenue)}</strong>
                    </div>
                    <p>{info.orders} orders</p>
                  </div>
                ))}
            </section>
          </>
        ) : activePage === "Customers" ? (
          <>
            <header className="topbar">
              <div>
                <div className="breadcrumb">
                  Workspace / <strong>Customers</strong>
                </div>
                <h1>Customers</h1>
                <p className="page-subtitle">
                  Customer activity based on your sales records.
                </p>
              </div>
            </header>

            <section className="panel">
              <div className="panel-heading">
                <h3>Customer Summary</h3>
              </div>

              {Array.from(
                salesData.reduce((map, sale) => {
                  const item = map.get(sale.customer) ?? {
                    orders: 0,
                    spending: 0,
                  };
                  item.orders += 1;
                  if (sale.status === "Completed") {
                    item.spending += sale.amount;
                  }
                  map.set(sale.customer, item);
                  return map;
                }, new Map<string, { orders: number; spending: number }>())
              )
                .sort((a, b) => b[1].spending - a[1].spending)
                .map(([customer, info]) => (
                  <div className="category-row" key={customer}>
                    <div className="category-info">
                      <span>{customer}</span>
                      <strong>{formatINR(info.spending)}</strong>
                    </div>
                    <p>{info.orders} orders</p>
                  </div>
                ))}
            </section>
          </>
        ) : activePage === "Help & Support" ? (
          <>
            <header className="topbar">
              <div>
                <div className="breadcrumb">
                  Workspace / <strong>Help &amp; Support</strong>
                </div>
                <h1>Help &amp; Support</h1>
                <p className="page-subtitle">
                  Quick guide to using PulseAnalytics.
                </p>
              </div>
            </header>

            <section className="panel">
              <h3>Getting started</h3>
              <p>
                <strong>Overview:</strong> Review sales KPIs, revenue charts,
                and category performance.
              </p>
              <p>
                <strong>Transactions:</strong> Search, filter, add, edit,
                and delete sales records.
              </p>
              <p>
                <strong>Products:</strong> Compare product order counts and
                completed revenue.
              </p>
              <p>
                <strong>Customers:</strong> Review order activity and
                completed spending.
              </p>
              <p>
                <strong>Analytics:</strong> Explore trends, regional
                performance, and order statuses.
              </p>
            </section>
          </>
        ) : (
          <>
            <header className="topbar">
              <div>
                <div className="breadcrumb">
                  Workspace / <strong>Settings</strong>
                </div>
                <h1>Settings</h1>
                <p className="page-subtitle">
                  Application information and configuration.
                </p>
              </div>
            </header>

            <section className="panel">
              <h3>Application information</h3>
              <p>
                <strong>Application:</strong> PulseAnalytics
              </p>
              <p>
                <strong>Data storage:</strong> SQLite through the Express API
              </p>
              <p>
                <strong>Frontend:</strong> React, TypeScript, and Vite
              </p>
              <p>
                <strong>Backend:</strong> Node.js and Express
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
