
import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { Sale } from "../data/salesData";

interface SalesChartProps {
  sales: Sale[];
}

export default function SalesChart({ sales }: SalesChartProps) {
  const dailyData = useMemo(() => {
    const totals = new Map<
      string,
      { date: string; revenue: number; profit: number }
    >();

    sales.forEach((sale) => {
      if (sale.status !== "Completed") return;

      const existing = totals.get(sale.date) ?? {
        date: sale.date,
        revenue: 0,
        profit: 0,
      };

      existing.revenue += sale.amount;
      existing.profit += sale.profit;

      totals.set(sale.date, existing);
    });

    return Array.from(totals.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [sales]);

  const currency = (value: number) =>
    `₹${(value / 1000).toFixed(0)}k`;

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h3>Revenue Overview</h3>
          <p>Daily revenue and profit from completed orders</p>
        </div>

        <span className="chart-period">Selected date range</span>
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-dot revenue-dot" />
          Revenue
        </span>
        <span>
          <i className="legend-dot profit-dot" />
          Profit
        </span>
      </div>

      <div className="chart-container">
        {dailyData.length === 0 ? (
          <div className="empty-state">
            No completed sales available for this selection.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyData}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="revenueFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#635bff"
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="95%"
                    stopColor="#635bff"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id="profitFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#19b88a"
                    stopOpacity={0.16}
                  />
                  <stop
                    offset="95%"
                    stopColor="#19b88a"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#edf0f5"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8991a5", fontSize: 11 }}
                minTickGap={20}
              />

              <YAxis
                yAxisId="revenue"
                orientation="left"
                tickFormatter={currency}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8991a5", fontSize: 11 }}
                width={45}
                domain={[0, "auto"]}
              />

              <YAxis
                yAxisId="profit"
                orientation="right"
                tickFormatter={currency}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#19b88a", fontSize: 11 }}
                width={45}
                domain={[0, "auto"]}
              />

              <Tooltip
                labelFormatter={(label) =>
                  formatDate(String(label))
                }
                formatter={(value, name) => [
                  `₹${Number(value).toLocaleString("en-IN")}`,
                  name === "revenue" ? "Revenue" : "Profit",
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e7e9f0",
                  fontSize: 12,
                }}
              />

              <Legend
                formatter={(value) =>
                  value === "revenue" ? "Revenue" : "Profit"
                }
              />

              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="#635bff"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                activeDot={{ r: 5 }}
              />

              <Area
                yAxisId="profit"
                type="monotone"
                dataKey="profit"
                name="profit"
                stroke="#19b88a"
                strokeWidth={2}
                fill="url(#profitFill)"
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
