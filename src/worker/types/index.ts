// User
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  citizenship: string | null;
  residency: string | null;
  itin_status: "not_started" | "pending" | "received";
  terms_version: string | null;
  privacy_version: string | null;
  consent_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// Evidence of informed consent captured at signup (legal trust boundary).
export interface SignupConsent {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  attestedAdult?: boolean;
  termsVersion?: string;
  privacyVersion?: string;
  timestamp?: string;
}

// Record that a user accepted a document version (terms/privacy).
export interface DocumentAcceptance {
  id: string;
  user_id: string;
  document_type: "terms" | "privacy";
  document_version: string;
  accepted_at: string;
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
  owner_name: string | null;
  owner_citizenship: string | null;
  owner_residency: string | null;
  owner_type: "foreign" | "domestic" | null;
  tax_classification: string | null;
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

// Holding (constellation node). Parent links live in HoldingRelationship.
export interface Holding {
  id: string;
  user_id: string;
  name: string;
  jurisdiction_country: string;
  jurisdiction_subdivision: string | null;
  base_currency: string;
  currency_as_of: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

// Parent-link history. Current parent = row where effective_to IS NULL.
export interface HoldingRelationship {
  id: string;
  child_holding_id: string;
  parent_holding_id: string;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

// Membership history: entity belongs to a holding over a time range.
export interface HoldingMember {
  id: string;
  holding_id: string;
  entity_id: string;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

// Calendar event (user- or system-created).
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  color: string;
  start_time: string;
  end_time: string | null;
  is_all_day: number;
  jurisdiction_country: string | null;
  event_type: string | null;
  source: "system" | "user";
  reminder: string | null;
  recurrence: string | null;
  entity_id: string | null;
  created_at: string;
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
