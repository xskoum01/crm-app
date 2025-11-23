// src/lib/api.ts
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  // pokud backend někde vrátí 204 No Content:
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
