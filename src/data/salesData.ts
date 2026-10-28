
export interface Sale {
  id: string;
  customer: string;
  product: string;
  category: string;
  region: string;
  date: string;
  amount: number;
  profit: number;
  status: "Completed" | "Pending" | "Cancelled";
}

export const salesData: Sale[] = [
  { id: "ORD-1001", customer: "Aarav Sharma", product: "Laptop Pro", category: "Electronics", region: "South", date: "2026-10-02", amount: 84999, profit: 12500, status: "Completed" },
  { id: "ORD-1002", customer: "Priya Nair", product: "Office Chair", category: "Furniture", region: "West", date: "2026-10-03", amount: 12999, profit: 3400, status: "Completed" },
  { id: "ORD-1003", customer: "Rahul Verma", product: "Running Shoes", category: "Fashion", region: "North", date: "2026-10-04", amount: 4999, profit: 1200, status: "Pending" },
  { id: "ORD-1004", customer: "Ananya Rao", product: "Smartphone", category: "Electronics", region: "South", date: "2026-10-05", amount: 45999, profit: 7200, status: "Completed" },
  { id: "ORD-1005", customer: "Ishaan Gupta", product: "Coffee Maker", category: "Appliances", region: "East", date: "2026-10-06", amount: 6499, profit: 1600, status: "Cancelled" },
  { id: "ORD-1006", customer: "Meera Iyer", product: "Desk Lamp", category: "Furniture", region: "South", date: "2026-10-08", amount: 2499, profit: 700, status: "Completed" },
  { id: "ORD-1007", customer: "Arjun Reddy", product: "Wireless Headphones", category: "Electronics", region: "West", date: "2026-10-10", amount: 8999, profit: 2300, status: "Completed" },
  { id: "ORD-1008", customer: "Sneha Patel", product: "Air Fryer", category: "Appliances", region: "North", date: "2026-10-12", amount: 7999, profit: 2100, status: "Pending" },
  { id: "ORD-1009", customer: "Vikram Das", product: "Backpack", category: "Fashion", region: "East", date: "2026-10-15", amount: 3299, profit: 900, status: "Completed" },
  { id: "ORD-1010", customer: "Kavya Menon", product: "Tablet", category: "Electronics", region: "South", date: "2026-10-18", amount: 28999, profit: 4800, status: "Completed" },
  { id: "ORD-1011", customer: "Aditya Joshi", product: "Bookshelf", category: "Furniture", region: "West", date: "2026-10-20", amount: 10999, profit: 2700, status: "Pending" },
  { id: "ORD-1012", customer: "Diya Kapoor", product: "Monitor", category: "Electronics", region: "North", date: "2026-10-22", amount: 18999, profit: 3900, status: "Completed" },
  { id: "ORD-1013", customer: "Rohan Shetty", product: "Blender", category: "Appliances", region: "South", date: "2026-10-24", amount: 3999, profit: 950, status: "Completed" },
  { id: "ORD-1014", customer: "Aisha Khan", product: "Sneakers", category: "Fashion", region: "East", date: "2026-10-25", amount: 5999, profit: 1400, status: "Cancelled" },
  { id: "ORD-1015", customer: "Kabir Singh", product: "Gaming Mouse", category: "Electronics", region: "West", date: "2026-10-26", amount: 2499, profit: 650, status: "Completed" }
];


export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export const getDashboardMetrics = (sales: Sale[]) => {
  const completedSales = sales.filter(
    (sale) => sale.status === "Completed"
  );

  const revenue = completedSales.reduce(
    (total, sale) => total + sale.amount,
    0
  );

  const profit = completedSales.reduce(
    (total, sale) => total + sale.profit,
    0
  );

  return {
    revenue,
    profit,
    orders: sales.length,
    customers: new Set(sales.map((sale) => sale.customer)).size,
    averageOrderValue:
      completedSales.length > 0
        ? revenue / completedSales.length
        : 0,
    completedOrders: completedSales.length,
    pendingOrders: sales.filter(
      (sale) => sale.status === "Pending"
    ).length,
    cancelledOrders: sales.filter(
      (sale) => sale.status === "Cancelled"
    ).length,
  };
};

