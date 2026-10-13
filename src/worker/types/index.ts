// User
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  citizenship: string | null;
  residency: string | null;
  itin_status: "not_started" | "pending" | "received";
  created_at: string;
  updated_at: string | null;
}

// Entity (LLC)
export interface Entity {
  id: string;
  user_id: string;
  name: string;
  formation_date: string | null;
  state: string | null;
  members_count: number | null;
  status: "idle" | "active" | "dormant";
  created_at: string;
}

// Task/Checklist
export interface Task {
  id: string;
  entity_id: string;
  title: string;
  section: "Formation" | "ITIN" | "Federal" | "Germany" | "Banking" | "Ongoing";
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  instructions: string | null;
  created_at: string;
}

// Document
export interface Document {
  id: string;
  entity_id: string;
  type: "W-7" | "OperatingAgreement" | "TreatyMemo";
  content: string; // JSON blob
  status: "draft" | "completed";
  created_at: string;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: "deadline" | "reminder" | "alert";
  sent_at: string;
  read: boolean;
}

// Auth context
export interface AuthPayload {
  sub: string; // user_id
  email: string;
  iat: number;
  exp: number;
}

// API response envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
