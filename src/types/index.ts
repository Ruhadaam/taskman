export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  uid?: string;
  createdAt?: string;
  unseen: string[];
  seen: string[];
}

export type TaskStatus = "waiting" | "completed" | "past_due";

export interface Task {
  id?: string;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  createdBy: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  type: "task" | "system";
  users: string[];
}
