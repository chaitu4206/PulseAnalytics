import { useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Plus, Trash2, X, Save } from "lucide-react";
import type { Sale } from "../data/salesData";
import { createSale, deleteSale, updateSale, type SaleInput } from "../api/salesApi";
import "./SalesManager.css";

interface SalesManagerProps {
  sales: Sale[];
  onChanged: () => Promise<void> | void;
}

type FormValues = {
  id: string;
  customer: string;
  product: string;
  category: string;
  region: Sale["region"];
  date: string;
  amount: string;
  profit: string;
  status: Sale["status"];
};

const emptyForm = (): FormValues => ({
  id: "", customer: "", product: "", category: "", region: "South",
  date: new Date().toISOString().slice(0, 10), amount: "", profit: "", status: "Pending",
});

export default function SalesManager({ sales, onChanged }: SalesManagerProps) {
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setError("");
    setMessage("");
  };

  const beginEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setForm({
      ...sale,
      amount: String(sale.amount),
      profit: String(sale.profit),
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const amount = Number(form.amount);
    const profit = Number(form.profit);
    if (!form.customer.trim() || !form.product.trim() || !form.category.trim()) {
      setError("Customer, product, and category are required.");
      return;
    }
    if (form.amount.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      setError("Amount must be a valid non-negative number.");
      return;
    }
    if (form.profit.trim() === "" || !Number.isFinite(profit)) {
      setError("Profit must be a valid number.");
      return;
    }

    const payload: SaleInput = {
      ...(editingId ? {} : { id: form.id.trim() }),
      customer: form.customer.trim(),
      product: form.product.trim(),
      category: form.category.trim(),
      region: form.region,
      date: form.date,
      amount,
      profit,
      status: form.status,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateSale(editingId, payload);
        setMessage(`Transaction ${editingId} updated successfully.`);
      } else {
        if (!form.id.trim()) {
          setError("Order ID is required.");
          setSaving(false);
          return;
        }
        await createSale(payload);
        setMessage(`Transaction ${form.id.trim()} created successfully.`);
      }
      await onChanged();
      setForm(emptyForm());
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (sale: Sale) => {
    if (!window.confirm(`Delete transaction ${sale.id}? This cannot be undone.`)) return;
    setError("");
    setMessage("");
    try {
      await deleteSale(sale.id);
      setMessage(`Transaction ${sale.id} deleted successfully.`);
      if (editingId === sale.id) resetForm();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete transaction.");
    }
  };

  return (
    <section className="panel sales-manager-panel">
      <div className="panel-heading">
        <div>
          <h3>Manage Sales</h3>
          <p>Create, edit, or delete records stored in SQLite</p>
        </div>
        <button type="button" className="export-button" onClick={resetForm}>
          <Plus size={16} /> New transaction
        </button>
      </div>

      {message && <p role="status" className="manager-message">{message}</p>}
      {error && <p role="alert" className="manager-error">{error}</p>}

      <form className="sales-form" onSubmit={submit}>
        <div className="sales-form-grid">
          <label>Order ID
            <input value={editingId ?? form.id} disabled={Boolean(editingId)} required onChange={(e) => setField("id", e.target.value)} placeholder="ORD-1016" />
          </label>
          <label>Customer
            <input value={form.customer} required onChange={(e) => setField("customer", e.target.value)} placeholder="Customer name" />
          </label>
          <label>Product
            <input value={form.product} required onChange={(e) => setField("product", e.target.value)} placeholder="Product name" />
          </label>
          <label>Category
            <input value={form.category} required onChange={(e) => setField("category", e.target.value)} placeholder="Electronics" />
          </label>
          <label>Region
            <select value={form.region} onChange={(e) => setField("region", e.target.value as Sale["region"])}>
              <option>North</option><option>South</option><option>East</option><option>West</option>
            </select>
          </label>
          <label>Date
            <input type="date" value={form.date} required onChange={(e) => setField("date", e.target.value)} />
          </label>
          <label>Amount (₹)
            <input type="number" min="0" step="0.01" value={form.amount} required onChange={(e) => setField("amount", e.target.value)} placeholder="3500" />
          </label>
          <label>Profit (₹)
            <input type="number" step="0.01" value={form.profit} required onChange={(e) => setField("profit", e.target.value)} placeholder="700" />
          </label>
          <label>Status
            <select value={form.status} onChange={(e) => setField("status", e.target.value as Sale["status"])}>
              <option>Completed</option><option>Pending</option><option>Cancelled</option>
            </select>
          </label>
        </div>
        <div className="sales-form-actions">
          <button className="export-button" type="submit" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : editingId ? "Save changes" : "Create transaction"}
          </button>
          {editingId && <button className="date-button" type="button" onClick={resetForm}><X size={15} /> Cancel edit</button>}
        </div>
      </form>

      <div className="sales-manager-list">
        <h4>Database records ({sales.length})</h4>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="order-id">{sale.id}</td>
                  <td>{sale.customer}</td><td>{sale.product}</td>
                  <td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(sale.amount)}</td>
                  <td>{sale.status}</td>
                  <td className="manager-row-actions">
                    <button type="button" className="date-button" onClick={() => beginEdit(sale)} aria-label={`Edit ${sale.id}`}><Pencil size={14} /> Edit</button>
                    <button type="button" className="date-button" onClick={() => void remove(sale)} aria-label={`Delete ${sale.id}`}><Trash2 size={14} /> Delete</button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={6} className="empty-state">No records in the database.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
