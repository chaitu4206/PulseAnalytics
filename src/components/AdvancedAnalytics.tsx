
import "./AdvancedAnalytics.css";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  fetchAnalytics,
  type AdvancedAnalytics as AnalyticsData,
} from "../api/analyticsApi";

import { formatINR } from "../data/salesData";

const COLORS = ["#635bff", "#20b99a", "#f5a742", "#ee7297", "#3286ed"];

const currency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

interface AdvancedAnalyticsProps {
  startDate: string;
  endDate: string;
  region: string;
  sales: unknown[];
}

export default function AdvancedAnalytics({
  startDate,
  endDate,
  region,
  sales,
}: AdvancedAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const result = await fetchAnalytics(
          { startDate, endDate, region },
          controller.signal
        );

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load advanced analytics."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => controller.abort();
  }, [startDate, endDate, region, sales, refreshKey]);

  const refreshAnalytics = () => {
    setRefreshKey((key) => key + 1);
  };

  if (loading && !data) {
    return (
      <section className="panel advanced-analytics">
        <p>Loading advanced analytics...</p>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="panel advanced-analytics" role="alert">
        <h3>Unable to load advanced analytics</h3>
        <p>{error}</p>
        <button
          type="button"
          onClick={refreshAnalytics}
          disabled={loading}
        >
          {loading ? "Retrying..." : "Retry"}
        </button>
      </section>
    );
  }

  if (!data) return null;

  const statusData = [
    { name: "Completed", value: data.statusCounts.Completed },
    { name: "Pending", value: data.statusCounts.Pending },
    { name: "Cancelled", value: data.statusCounts.Cancelled },
  ];

  return (
    <section className="advanced-analytics">
      <div className="advanced-analytics-heading">
        <div>
          <h2>Advanced Analytics</h2>
          <p>
            Revenue, profitability, products, and order status.
          </p>
          <p>
            {region === "All regions" ? "All regions" : region}
            {" · "}
            {startDate} to {endDate}
          </p>
        </div>

        <button
          className="date-button"
          type="button"
          onClick={refreshAnalytics}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh analytics"}
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {loading && (
        <p aria-live="polite">Updating analytics...</p>
      )}

      <div className="analytics-summary-grid">
        <article className="panel analytics-summary-card">
          <span>Completed revenue</span>
          <strong>{formatINR(data.totalRevenue)}</strong>
        </article>

        <article className="panel analytics-summary-card">
          <span>Completed profit</span>
          <strong>{formatINR(data.totalProfit)}</strong>
        </article>

        <article className="panel analytics-summary-card">
          <span>Profit margin</span>
          <strong>{data.profitMargin.toFixed(2)}%</strong>
        </article>

        <article className="panel analytics-summary-card">
          <span>Completed orders</span>
          <strong>
            {data.completedOrders} / {data.totalOrders}
          </strong>
        </article>
      </div>

      <div className="analytics-charts-grid">
        <article className="panel analytics-chart-panel">
          <h3>Monthly Revenue and Profit</h3>
          <p>Completed orders, grouped by month.</p>

          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={currency} width={95} />
                <Tooltip
                  formatter={(value) => currency(Number(value))}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#635bff"
                />
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="#20b99a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel analytics-chart-panel">
          <h3>Revenue by Region</h3>
          <p>Compare completed sales across regions.</p>

          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byRegion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={currency} width={95} />
                <Tooltip
                  formatter={(value) => currency(Number(value))}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#3286ed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel analytics-chart-panel">
          <h3>Top Five Products</h3>
          <p>Ranked by completed-order revenue.</p>

          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={currency}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={125}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => currency(Number(value))}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#f5a742"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel analytics-chart-panel">
          <h3>Order Status Breakdown</h3>
          <p>All orders matching the selected filters.</p>

          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) =>
                    `${name}: ${value}`
                  }
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}
