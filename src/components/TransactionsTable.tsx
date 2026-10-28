
import { useMemo, useState } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Sale } from "../data/salesData";
import { formatINR } from "../data/salesData";

type StatusFilter = "All statuses" | Sale["status"];

interface TransactionsTableProps {
  sales: Sale[];
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
}

type SortKey = "id" | "customer" | "date" | "amount" | "status";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 5;

export default function TransactionsTable({
  sales,
  search,
  onSearchChange,
  status,
  onStatusChange,
}: TransactionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sales
      .filter((sale) => {
        const matchesSearch = [
          sale.id,
          sale.customer,
          sale.product,
          sale.category,
          sale.region,
        ].some((value) => value.toLowerCase().includes(query));

        const matchesStatus =
          status === "All statuses" || sale.status === status;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const first = a[sortKey];
        const second = b[sortKey];

        const comparison =
          typeof first === "number" && typeof second === "number"
            ? first - second
            : String(first).localeCompare(String(second));

        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [sales, search, status, sortKey, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSales.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const pageSales = filteredSales.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const changeSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) =>
        direction === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection(
        key === "date" || key === "amount" ? "desc" : "asc"
      );
    }

    setPage(1);
  };

  const sortButton = (label: string, key: SortKey) => (
    <button
      type="button"
      className="sort-button"
      onClick={() => changeSort(key)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown size={12} />
      {sortKey === key && (
        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );

  return (
    <section className="panel transactions-panel">
      <div className="panel-heading transaction-heading">
        <div>
          <h3>Recent Transactions</h3>
          <p>Search, sort, and manage your sales records</p>
        </div>

        <div className="table-actions">
          <label className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => {
                onSearchChange(event.target.value);
                setPage(1);
              }}
              placeholder="Search transactions..."
              aria-label="Search transactions"
            />
          </label>

          <select
            value={status}
            onChange={(event) => {
              onStatusChange(
                event.target.value as StatusFilter
              );
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="All statuses">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{sortButton("ORDER ID", "id")}</th>
              <th>{sortButton("CUSTOMER", "customer")}</th>
              <th>PRODUCT</th>
              <th>REGION</th>
              <th>{sortButton("DATE", "date")}</th>
              <th>{sortButton("AMOUNT", "amount")}</th>
              <th>{sortButton("STATUS", "status")}</th>
            </tr>
          </thead>

          <tbody>
            {pageSales.map((sale) => (
              <tr key={sale.id}>
                <td className="order-id">{sale.id}</td>
                <td>{sale.customer}</td>
                <td>{sale.product}</td>
                <td>{sale.region}</td>
                <td>
                  {new Date(`${sale.date}T00:00:00`).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </td>
                <td className="amount">{formatINR(sale.amount)}</td>
                <td>
                  <span
                    className={`status status-${sale.status.toLowerCase()}`}
                  >
                    <i />
                    {sale.status}
                  </span>
                </td>
              </tr>
            ))}

            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No transactions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-bottom pagination-bar">
        <span>
          {filteredSales.length === 0
            ? "No records"
            : `Showing ${
                (currentPage - 1) * PAGE_SIZE + 1
              }–${Math.min(
                currentPage * PAGE_SIZE,
                filteredSales.length
              )} of ${filteredSales.length} records`}
        </span>

        <div className="pagination-controls">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() =>
              setPage((value) => Math.max(1, value - 1))
            }
            aria-label="Previous page"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setPage((value) =>
                Math.min(totalPages, value + 1)
              )
            }
            aria-label="Next page"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
