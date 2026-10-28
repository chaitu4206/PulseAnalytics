# PulseAnalytics — Sales Analytics Dashboard

A full-stack sales analytics dashboard built with React, TypeScript, Express, and SQLite. PulseAnalytics helps users explore sales transactions, monitor key performance indicators, analyze revenue and profit, and manage sales records through an interactive interface.

## Features

- **Dashboard Overview** — Monitor key metrics such as revenue, profit, orders, and customers.
- **Transaction Management** — View, search, filter, create, update, and delete sales transactions.
- **Product Analytics** — Analyze product and category performance.
- **Customer Insights** — Explore customer-related sales information.
- **Advanced Analytics** — Visualize sales trends, regional performance, categories, and top products.
- **Interactive Charts** — Explore business data through charts built with Recharts.
- **CSV Export** — Export transaction data for further analysis.
- **Responsive Interface** — Navigate the dashboard through a sidebar-based layout.
- **REST API** — Access sales, metrics, and analytics through Express endpoints.
- **Persistent Local Database** — Store sales records using SQLite.
- **Automated Tests** — Test frontend components and backend API behavior.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling and Icons | CSS, Lucide React |
| Data Visualization | Recharts |
| Backend | Node.js, Express 5 |
| Database | SQLite, better-sqlite3 |
| Testing | Vitest, React Testing Library, Node.js test tooling |

## Project Structure

```text
PulseAnalytics/
├── public/                  # Static public assets
├── server/
│   ├── index.js             # Express API and static frontend server
│   ├── database.js          # SQLite database and initialization
│   ├── package.json         # Backend dependencies and scripts
│   └── tests/               # Backend API tests
├── src/
│   ├── api/                 # API client functions
│   ├── assets/              # Frontend assets
│   ├── components/          # Dashboard components
│   ├── data/                # Frontend data utilities
│   ├── App.tsx              # Main application
│   └── main.tsx             # Frontend entry point
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) — use a version compatible with the project's dependencies.
- npm — included with Node.js.
- [Git](https://git-scm.com/) — required to clone the repository.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/chaitu4206/PulseAnalytics.git
cd PulseAnalytics
```

### 2. Install frontend dependencies

From the project root:

```bash
npm ci
```

### 3. Install backend dependencies

```bash
cd server
npm ci
cd ..
```

### 4. Configure the frontend API URL

Create a `.env.local` file in the project root:

```env
VITE_API_URL=http://localhost:5000/api
```

This configuration connects the Vite development frontend to the local Express API.

## Running the Application

### 1. Start the backend

Open a terminal in the project root and run:

```bash
npm start
```

The API runs at:

```text
http://localhost:5000
```

The backend initializes the SQLite database and seeds sample sales records if the database is empty.

### 2. Start the frontend

Open a second terminal in the project root:

```bash
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:5173
```

Keep both terminals running while using the application in development mode.

## API Endpoints

The backend exposes the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API health |
| GET | `/api/sales` | Retrieve sales transactions |
| POST | `/api/sales` | Create a transaction |
| PUT | `/api/sales/:id` | Update a transaction |
| DELETE | `/api/sales/:id` | Delete a transaction |
| GET | `/api/metrics` | Retrieve dashboard metrics |
| GET | `/api/analytics` | Retrieve analytics and grouped sales data |

The sales endpoint supports filtering by region, date range, status, and search term.

Example health check:

```bash
curl http://localhost:5000/api/health
```

## Production Build

Build the frontend for production:

```bash
npm run build
```

The generated frontend files are written to the `dist/` directory.

To serve the production frontend and API from the same Express server, run:

```bash
npm start
```

After building, open:

```text
http://localhost:5000
```

## Running Tests

### Frontend tests

From the project root:

```bash
npm test
```

### Backend tests

From the project root:

```bash
cd server
npm test
```

If the backend test script is unavailable, inspect `server/package.json` for the configured test command.

## Database

PulseAnalytics uses SQLite through `better-sqlite3`.

By default, the database is created at:

```text
server/pulseanalytics.db
```

You can override this location using the `DB_PATH` environment variable:

```env
DB_PATH=/path/to/pulseanalytics.db
```

The database schema includes sales transactions and indexes for commonly filtered fields. Sample records are inserted only when the sales table is empty.

**Important:** The local database is excluded from Git. A fresh installation creates its own local database and initializes sample data. Your local database records are not included in the GitHub repository.

## Security and Configuration

- Keep `.env` and `.env.local` files out of version control.
- Never commit passwords, API keys, or access tokens.
- Keep local SQLite database and WAL files out of Git.
- Use environment variables for deployment-specific configuration.

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit your changes with a descriptive message.
5. Open a pull request.

## Author

**Chaitanya Reddy**

GitHub: [@chaitu4206](https://github.com/chaitu4206)

## License

No license has been specified yet. Unless a license is added to this repository, others should not assume they have permission to redistribute or modify the project.

---

If you find this project useful, consider giving the repository a star!
