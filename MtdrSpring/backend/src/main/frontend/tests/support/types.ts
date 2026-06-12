export type UserRole = 'manager' | 'developer';

export type SystemRole = 'PROJECT_MANAGER' | 'DEVELOPER' | 'ADMIN';

export interface UserCredentials {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  systemRole: SystemRole;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TeamMember {
  id: string;
  role: SystemRole;
  user: {
    id: string;
    email: string;
    systemRole: SystemRole;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  projectName: string;
  sprintId: string;
  assigneeId?: string | null;
  assignee?: TeamMember['user'] | null;
  createdBy?: TeamMember['user'] | null;
  createdAt: string;
  dueDate?: string;
  enteredInProgressAt?: string;
  completedAt?: string;
  reworkCount?: number;
}

export interface Sprint {
  id: string;
  name: string;
  status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
  startDate: string;
  endDate: string;
  plannedTaskCount: number;
  doneTaskCount: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface AnalyticsSummary {
  sprintId: string;
  avgCycleTimeDays: number;
  cycleTimeChangePct: number;
}

export interface DeveloperAnalytics {
  email: string;
  totalAssigned: number;
  tasksCompleted: number;
  totalHoursWorked: number;
}

export interface MockLoginResponse {
  accessToken?: string;
  idToken?: string;
  error?: string;
  message?: string;
}

export interface MockDownload {
  filename: string;
  contentType: string;
  body: string;
}
