
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export interface AnalyticsGroup {
  name: string;
  orders: number;
  revenue: number;
  profit: number;
}

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  region: string;
}

export interface AdvancedAnalytics {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  monthlyTrends: AnalyticsGroup[];
  byRegion: AnalyticsGroup[];
  byCategory: AnalyticsGroup[];
  topProducts: AnalyticsGroup[];
  statusCounts: {
    Completed: number;
    Pending: number;
    Cancelled: number;
  };
}

export async function fetchAnalytics(
  filters: AnalyticsFilters,
  signal?: AbortSignal
): Promise<AdvancedAnalytics> {
  const params = new URLSearchParams();

  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);

  if (filters.region && filters.region !== "All regions") {
    params.set("region", filters.region);
  }

  const response = await fetch(
    `${API_BASE_URL}/analytics?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Analytics API failed: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error("Invalid analytics API response");
  }

  return result.data as AdvancedAnalytics;
}
