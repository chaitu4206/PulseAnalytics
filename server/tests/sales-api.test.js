
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

// Use a separate in-memory database for this test process.
process.env.DB_PATH = ":memory:";

const app = require("../index");
const db = require("../database");
console.log("Test database is in-memory:", db.name === ":memory:");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  db.close();
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const body = await response.json();
  return { status: response.status, body };
}

const sampleSale = {
  id: "TEST-9001",
  customer: "Test Customer",
  product: "Test Laptop",
  category: "Electronics",
  region: "South",
  date: "2026-10-27",
  amount: 50000,
  profit: 8000,
  status: "Completed",
};

test("GET /api/health returns a successful health check", async () => {
  const { status, body } = await request("/api/health");

  assert.equal(status, 200);
  assert.equal(body.success, true);
});

test("GET /api/sales returns seeded records", async () => {
  const { status, body } = await request("/api/sales");

  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.ok(body.count >= 15);
  assert.ok(Array.isArray(body.data));
});

test("POST /api/sales creates a new transaction", async () => {
  const { status, body } = await request("/api/sales", {
    method: "POST",
    body: JSON.stringify(sampleSale),
  });

  assert.equal(status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.id, sampleSale.id);
});

test("POST /api/sales rejects duplicate IDs", async () => {
  const { status, body } = await request("/api/sales", {
    method: "POST",
    body: JSON.stringify(sampleSale),
  });

  assert.equal(status, 409);
  assert.equal(body.success, false);
});

test("PUT /api/sales/:id updates a transaction", async () => {
  const updatedSale = {
    ...sampleSale,
    amount: 52000,
    profit: 8500,
    status: "Completed",
  };

  const { status, body } = await request(
    `/api/sales/${sampleSale.id}`,
    {
      method: "PUT",
      body: JSON.stringify(updatedSale),
    }
  );

  assert.equal(status, 200);
  assert.equal(body.data.amount, 52000);
  assert.equal(body.data.profit, 8500);
});

test("GET /api/analytics returns analytics data", async () => {
  const { status, body } = await request(
    "/api/analytics?region=South&startDate=2026-10-01&endDate=2026-10-31"
  );

  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data.monthlyTrends));
  assert.ok(Array.isArray(body.data.byRegion));
  assert.ok(Array.isArray(body.data.topProducts));
  assert.equal(body.data.byRegion.length, 1);
  assert.equal(body.data.byRegion[0].name, "South");
});

test("POST /api/sales rejects an invalid region", async () => {
  const invalidSale = {
    ...sampleSale,
    id: "TEST-9002",
    region: "Central",
  };

  const { status, body } = await request("/api/sales", {
    method: "POST",
    body: JSON.stringify(invalidSale),
  });

  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test("DELETE /api/sales/:id deletes a transaction", async () => {
  const { status, body } = await request(
    `/api/sales/${sampleSale.id}`,
    { method: "DELETE" }
  );

  assert.equal(status, 200);
  assert.equal(body.success, true);

  const readResult = await request("/api/sales");
  assert.equal(
    readResult.body.data.some((sale) => sale.id === sampleSale.id),
    false
  );
});

test("DELETE /api/sales/:id returns 404 for a missing ID", async () => {
  const { status, body } = await request(
    "/api/sales/DOES-NOT-EXIST",
    { method: "DELETE" }
  );

  assert.equal(status, 404);
  assert.equal(body.success, false);
});


test("POST /api/sales rejects a negative amount", async () => {
  const invalidSale = {
    ...sampleSale,
    id: "TEST-9003",
    amount: -100,
  };

  const { status, body } = await request("/api/sales", {
    method: "POST",
    body: JSON.stringify(invalidSale),
  });

  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /amount/i);
});

test("POST /api/sales rejects an invalid date", async () => {
  const invalidSale = {
    ...sampleSale,
    id: "TEST-9004",
    date: "2026-02-30",
  };

  const { status, body } = await request("/api/sales", {
    method: "POST",
    body: JSON.stringify(invalidSale),
  });

  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /date/i);
});

test("POST /api/sales rejects missing required fields", async () => {
  const invalidSale = {
    id: "TEST-9005",
    customer: "Test Customer",
  };

  const { status, body } = await request("/api/sales", {
    method: "POST",
    body: JSON.stringify(invalidSale),
  });

  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /required/i);
});

test("PUT /api/sales/:id returns 404 for a missing transaction", async () => {
  const missingSale = {
    ...sampleSale,
    id: "DOES-NOT-EXIST",
  };

  const { status, body } = await request(
    "/api/sales/DOES-NOT-EXIST",
    {
      method: "PUT",
      body: JSON.stringify(missingSale),
    }
  );

  assert.equal(status, 404);
  assert.equal(body.success, false);
});
