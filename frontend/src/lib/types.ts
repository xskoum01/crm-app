// ---------- Customers ----------

export type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
};

// ---------- Leads ----------

export type Lead = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  note?: string | null;
};

// ---------- Tasks ----------

export type Assignee = "vlada" | "peta";

// typ pro stav úkolu – můžeš si klidně přidat další hodnoty
export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: number;
  title: string;
  description?: string | null;
  priority: number;
  due_date?: string | null;    // ISO datum
  assignee: Assignee;          // používáme alias výš
  done: boolean;               // kvůli backendu to necháme
  status?: TaskStatus;         // nový stav pro frontend
  customer_id?: number | null; // lookup na zákazníka
};

// ---------- Meetings ----------

export type MeetingStatus = "planned" | "done" | "cancelled";

export type Meeting = {
  id: number;
  title: string;
  date?: string | null;        // ISO datum, např. "2025-11-21"
  time?: string | null;        // čas jako "14:30"
  customer_id?: number | null;
  note?: string | null;
  status?: MeetingStatus;
  user_ids?: number[];         // více uživatelů
};

// ---------- Users ----------

export type UserRole = "user" | "manager" | "admin";

export type User = {
  id: number;
  name: string;
  email: string;
  role?: UserRole | null;
  active?: boolean | null;
  note?: string | null;
};
