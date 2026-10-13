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
  formationDate: string;
  state: string;
  membersCount: number;
  businessType: string;
  createdAt: string;
}

export interface Task {
  id: string;
  entityId: string;
  title: string;
  section: "Formation" | "ITIN" | "Federal" | "German" | "Banking" | "Ongoing";
  dueDate: string | null;
  completed: boolean;
  instructions: string;
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
