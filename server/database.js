
const Database = require("better-sqlite3");
const path = require("path");
const databasePath = process.env.DB_PATH
  ? process.env.DB_PATH
  : path.join(__dirname, "pulseanalytics.db");

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    profit REAL NOT NULL,
    status TEXT NOT NULL CHECK (
      status IN ('Completed', 'Pending', 'Cancelled')
    )
  );

  CREATE INDEX IF NOT EXISTS idx_sales_date
  ON sales(date);

  CREATE INDEX IF NOT EXISTS idx_sales_region
  ON sales(region);

  CREATE INDEX IF NOT EXISTS idx_sales_status
  ON sales(status);
`);

const initialSales = [
  ["ORD-1001", "Aarav Sharma", "Laptop Pro", "Electronics", "South", "2026-10-02", 84999, 12500, "Completed"],
  ["ORD-1002", "Priya Nair", "Office Chair", "Furniture", "West", "2026-10-03", 12999, 3400, "Completed"],
  ["ORD-1003", "Rahul Verma", "Running Shoes", "Fashion", "North", "2026-10-04", 4999, 1200, "Pending"],
  ["ORD-1004", "Ananya Rao", "Smartphone", "Electronics", "South", "2026-10-05", 45999, 7200, "Completed"],
  ["ORD-1005", "Ishaan Gupta", "Coffee Maker", "Appliances", "East", "2026-10-06", 6499, 1600, "Cancelled"],
  ["ORD-1006", "Meera Iyer", "Desk Lamp", "Furniture", "South", "2026-10-08", 2499, 700, "Completed"],
  ["ORD-1007", "Arjun Reddy", "Wireless Headphones", "Electronics", "West", "2026-10-10", 8999, 2300, "Completed"],
  ["ORD-1008", "Sneha Patel", "Air Fryer", "Appliances", "North", "2026-10-12", 7999, 2100, "Pending"],
  ["ORD-1009", "Vikram Das", "Backpack", "Fashion", "East", "2026-10-15", 3299, 900, "Completed"],
  ["ORD-1010", "Kavya Menon", "Tablet", "Electronics", "South", "2026-10-18", 28999, 4800, "Completed"],
  ["ORD-1011", "Aditya Joshi", "Bookshelf", "Furniture", "West", "2026-10-20", 10999, 2700, "Pending"],
  ["ORD-1012", "Diya Kapoor", "Monitor", "Electronics", "North", "2026-10-22", 18999, 3900, "Completed"],
  ["ORD-1013", "Rohan Shetty", "Blender", "Appliances", "South", "2026-10-24", 3999, 950, "Completed"],
  ["ORD-1014", "Aisha Khan", "Sneakers", "Fashion", "East", "2026-10-25", 5999, 1400, "Cancelled"],
  ["ORD-1015", "Kabir Singh", "Gaming Mouse", "Electronics", "West", "2026-10-26", 2499, 650, "Completed"],
];

const count = db.prepare(
  "SELECT COUNT(*) AS total FROM sales"
).get().total;

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO sales (
      id, customer, product, category, region,
      date, amount, profit, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seed = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(...row);
    }
  });

  seed(initialSales);
}

console.log(
  `SQLite database ready: ${db.prepare("SELECT COUNT(*) AS total FROM sales").get().total} sales records`
);

module.exports = db;
