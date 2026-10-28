import type { Sale } from "../data/salesData";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

interface SalesResponse {
  success: boolean;
  count?: number;
  data?: Sale[] | Sale;
  message?: string;
}

export type SaleInput = Omit<Sale, "id"> & { id?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const result = (await response.json()) as SalesResponse;
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result as T;
}

export async function fetchSales(): Promise<Sale[]> {
  const result = await request<SalesResponse>("/sales");
  if (!Array.isArray(result.data)) throw new Error("Invalid sales API response");
  return result.data;
}

export async function createSale(sale: SaleInput): Promise<Sale> {
  const result = await request<SalesResponse>("/sales", {
    method: "POST",
    body: JSON.stringify(sale),
  });
  return result.data as Sale;
}

export async function updateSale(id: string, sale: SaleInput): Promise<Sale> {
  const result = await request<SalesResponse>(`/sales/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(sale),
  });
  return result.data as Sale;
}

export async function deleteSale(id: string): Promise<void> {
  await request<SalesResponse>(`/sales/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
