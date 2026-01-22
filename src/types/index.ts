export interface User {
  id: string;
  name: string;
  email: string;
  uid?: string;
  createdAt?: string;
}

export type TaskStatus = "waiting" | "completed" | "past_due";

export interface Task {
  id?: string;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  createdBy: string;
  isArchived?: boolean; // false: Active, true: Archived
}

export interface RecurringTask {
  id?: string;
  title: string;
  createdBy: string;
  lastCompletedAt?: Date;
  createdAt?: Date;
}
