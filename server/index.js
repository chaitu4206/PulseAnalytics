require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./database");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

const allowedRegions = ["North", "South", "East", "West"];
const allowedStatuses = ["Completed", "Pending", "Cancelled"];
const fields = ["id", "customer", "product", "category", "region", "date", "amount", "profit", "status"];

function filterSales(query) {
  const { region, startDate, endDate, search, status } = query;
  const conditions = [];
  const params = [];

  if (region && region !== "All regions") {
    conditions.push("region = ?");
    params.push(region);
  }
  if (startDate) {
    conditions.push("date >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("date <= ?");
    params.push(endDate);
  }
  if (status && status !== "All statuses") {
    conditions.push("status = ?");
    params.push(status);
  }
  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    conditions.push(`(id LIKE ? COLLATE NOCASE OR customer LIKE ? COLLATE NOCASE OR product LIKE ? COLLATE NOCASE OR category LIKE ? COLLATE NOCASE OR region LIKE ? COLLATE NOCASE)`);
    params.push(term, term, term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return db.prepare(`SELECT ${fields.join(", ")} FROM sales ${where} ORDER BY date ASC, id ASC`).all(...params);
}

function validateSale(body, requireId = true) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Request body must be a JSON object";
  const required = requireId ? fields : fields.filter((field) => field !== "id");
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || (typeof body[field] === "string" && body[field].trim() === "")) {
      return `${field} is required`;
    }
  }
  for (const field of ["customer", "product", "category"]) {
    if (typeof body[field] !== "string" || !body[field].trim()) return `${field} must be a non-empty string`;
  }
  if (requireId && (typeof body.id !== "string" || !body.id.trim())) return "id must be a non-empty string";
  if (!allowedRegions.includes(body.region)) return "Region must be North, South, East, or West";
  if (!allowedStatuses.includes(body.status)) return "Status must be Completed, Pending, or Cancelled";
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount < 0) return "Amount must be a valid non-negative number";
  if (typeof body.profit !== "number" || !Number.isFinite(body.profit)) return "Profit must be a valid number";
  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return "Date must use YYYY-MM-DD format";
  const parsed = new Date(`${body.date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== body.date) return "Date must be a valid calendar date";
  return null;
}

function normalizeSale(body) {
  return {
    id: body.id.trim(),
    customer: body.customer.trim(),
    product: body.product.trim(),
    category: body.category.trim(),
    region: body.region,
    date: body.date,
    amount: body.amount,
    profit: body.profit,
    status: body.status,
  };
}

function isDuplicateError(error) {
  return error && (error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" || error.code === "SQLITE_CONSTRAINT_UNIQUE");
}

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "PulseAnalytics API is running" });
});

app.get("/api/sales", (req, res) => {
  try {
    const data = filterSales(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Sales API error:", error);
    res.status(500).json({ success: false, message: "Unable to retrieve sales records" });
  }
});

app.post("/api/sales", (req, res) => {
  const validationError = validateSale(req.body);
  if (validationError) return res.status(400).json({ success: false, message: validationError });
  const sale = normalizeSale(req.body);
  try {
    db.prepare(`INSERT INTO sales (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`).run(...fields.map((field) => sale[field]));
    res.status(201).json({ success: true, message: "Sales transaction created", data: sale });
  } catch (error) {
    if (isDuplicateError(error)) return res.status(409).json({ success: false, message: "A transaction with this order ID already exists" });
    console.error("Create sale error:", error);
    res.status(500).json({ success: false, message: "Unable to create sales transaction" });
  }
});

app.put("/api/sales/:id", (req, res) => {
  const validationError = validateSale({ ...req.body, id: req.params.id });
  if (validationError) return res.status(400).json({ success: false, message: validationError });
  const sale = normalizeSale({ ...req.body, id: req.params.id });
  try {
    const result = db.prepare(`UPDATE sales SET customer = ?, product = ?, category = ?, region = ?, date = ?, amount = ?, profit = ?, status = ? WHERE id = ?`).run(sale.customer, sale.product, sale.category, sale.region, sale.date, sale.amount, sale.profit, sale.status, sale.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: "Transaction not found" });
    res.json({ success: true, message: "Sales transaction updated", data: sale });
  } catch (error) {
    console.error("Update sale error:", error);
    res.status(500).json({ success: false, message: "Unable to update sales transaction" });
  }
});

app.delete("/api/sales/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM sales WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: "Transaction not found" });
    res.json({ success: true, message: "Sales transaction deleted" });
  } catch (error) {
    console.error("Delete sale error:", error);
    res.status(500).json({ success: false, message: "Unable to delete sales transaction" });
  }
});

app.get("/api/metrics", (req, res) => {
  try {
    const selectedSales = filterSales(req.query);
    const completed = selectedSales.filter((sale) => sale.status === "Completed");
    const revenue = completed.reduce((sum, sale) => sum + sale.amount, 0);
    const profit = completed.reduce((sum, sale) => sum + sale.profit, 0);
    res.json({
      success: true,
      data: {
        totalOrders: selectedSales.length,
        completedOrders: completed.length,
        pendingOrders: selectedSales.filter((sale) => sale.status === "Pending").length,
        cancelledOrders: selectedSales.filter((sale) => sale.status === "Cancelled").length,
        revenue,
        profit,
        uniqueCustomers: new Set(selectedSales.map((sale) => sale.customer)).size,
        averageOrderValue: completed.length ? revenue / completed.length : 0,
      },
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    res.status(500).json({ success: false, message: "Unable to calculate dashboard metrics" });
  }
});

app.get("/api/analytics", (req, res) => {
  try {
    const sales = filterSales(req.query);

    // Revenue and profit use completed orders only.
    const completedSales = sales.filter(
      (sale) => sale.status === "Completed"
    );

    const groupBy = (records, getKey) => {
      const groups = new Map();

      for (const sale of records) {
        const key = getKey(sale);

        if (!groups.has(key)) {
          groups.set(key, {
            name: key,
            orders: 0,
            revenue: 0,
            profit: 0,
          });
        }

        const group = groups.get(key);
        group.orders += 1;
        group.revenue += sale.amount;
        group.profit += sale.profit;
      }

      return Array.from(groups.values());
    };

    const monthlyTrends = groupBy(
      completedSales,
      (sale) => sale.date.slice(0, 7)
    ).sort((a, b) => a.name.localeCompare(b.name));

    const byRegion = groupBy(
      completedSales,
      (sale) => sale.region
    ).sort((a, b) => b.revenue - a.revenue);

    const byCategory = groupBy(
      completedSales,
      (sale) => sale.category
    ).sort((a, b) => b.revenue - a.revenue);

    const topProducts = groupBy(
      completedSales,
      (sale) => sale.product
    )
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const statusCounts = {
      Completed: 0,
      Pending: 0,
      Cancelled: 0,
    };

    for (const sale of sales) {
      statusCounts[sale.status] += 1;
    }

    const totalRevenue = completedSales.reduce(
      (sum, sale) => sum + sale.amount,
      0
    );

    const totalProfit = completedSales.reduce(
      (sum, sale) => sum + sale.profit,
      0
    );

    res.json({
      success: true,
      data: {
        totalOrders: sales.length,
        completedOrders: completedSales.length,
        totalRevenue,
        totalProfit,
        profitMargin:
          totalRevenue > 0
            ? (totalProfit / totalRevenue) * 100
            : 0,
        monthlyTrends,
        byRegion,
        byCategory,
        topProducts,
        statusCounts,
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to calculate advanced analytics",
    });
  }
});

app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "API endpoint not found" }));
const distPath = path.join(__dirname, "..", "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PulseAnalytics API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
