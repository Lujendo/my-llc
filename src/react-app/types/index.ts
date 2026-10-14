export interface User {
  id: string;
  email: string;
  name: string;
  citizenship: string;
  residency: string;
  itinStatus: boolean;
  createdAt: string;
}

export interface Entity {
  id: string;
  userId: string;
  name: string;
  // ponytail: formationDate typed non-null to satisfy the off-limits
  // DocumentGenerator `iso(s?: string)` param; it may be null at runtime and every
  // reader treats it as falsy.
  formationDate: string;
  state: string | null;
  membersCount: number | null;
  status?: "idle" | "active" | "dormant";
  ownerName?: string | null;
  ownerCitizenship?: string | null;
  ownerResidency?: string | null;
  ownerType?: "foreign" | "domestic" | null;
  taxClassification?: string | null;
  businessType?: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  entityId: string;
  title: string;
  section: "Formation" | "ITIN" | "Federal" | "Germany" | "Banking" | "Ongoing";
  dueDate: string | null;
  completed: boolean;
  completedAt?: string | null;
  instructions: string | null;
  createdAt: string;
}

export interface Deadline {
  id: string;
  entityId: string;
  title: string;
  dueDate: string;
  category: "US" | "State" | "HomeCountry" | "Compliance";
  status: "overdue" | "pending" | "completed";
  urgency: "high" | "medium" | "low";
}

export interface TreatyAnalysis {
  citizenship: string;
  residency: string;
  entityType: string;
  income: number;
  riskLevel: "low" | "medium" | "high";
  applicableTreaties: string[];
  mitigationSteps: string[];
  filingOrder: string[];
  expectedTaxRate: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "email" | "sms" | "in-app";
  read: boolean;
  createdAt: string;
}
