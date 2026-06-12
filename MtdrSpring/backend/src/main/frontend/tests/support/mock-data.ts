import type {
  AnalyticsSummary,
  DeveloperAnalytics,
  MockDownload,
  MockLoginResponse,
  Project,
  Sprint,
  Task,
  TeamMember,
} from './types';
import { TEST_USERS } from './constants';

export const mockInvalidLoginResponse: MockLoginResponse = {
  error: 'access_denied',
  message: 'Invalid credentials',
};

export const mockManagerLoginResponse: MockLoginResponse = {
  accessToken: 'mock-manager-access-token',
  idToken: 'mock-manager-id-token',
};

export const mockDeveloperLoginResponse: MockLoginResponse = {
  accessToken: 'mock-developer-access-token',
  idToken: 'mock-developer-id-token',
};

export const mockProjects: Project[] = [
  {
    id: 'proj-cloud',
    name: 'Oracle Cloud PM',
    description: 'Sprint planning and delivery dashboard for the Oracle PM course project.',
  },
];

export const mockSprints: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Sprint 5 Quality Sprint',
    status: 'ACTIVE',
    startDate: '2026-06-01',
    endDate: '2026-06-14',
    plannedTaskCount: 7,
    doneTaskCount: 2,
  },
  {
    id: 'sprint-0',
    name: 'Sprint 4 Stabilization',
    status: 'COMPLETED',
    startDate: '2026-05-15',
    endDate: '2026-05-30',
    plannedTaskCount: 5,
    doneTaskCount: 5,
  },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'membership-manager',
    role: 'PROJECT_MANAGER',
    user: {
      id: 'user-manager',
      email: TEST_USERS.manager.email,
      systemRole: TEST_USERS.manager.systemRole,
    },
  },
  {
    id: 'membership-developer',
    role: 'DEVELOPER',
    user: {
      id: 'user-developer',
      email: TEST_USERS.developer.email,
      systemRole: TEST_USERS.developer.systemRole,
    },
  },
  {
    id: 'membership-luis',
    role: 'DEVELOPER',
    user: {
      id: 'user-luis',
      email: 'a01644423@tec.mx',
      systemRole: 'DEVELOPER',
    },
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-a',
    title: 'Implement login audit trail',
    description: 'Persist login audit events for security review.',
    priority: 'HIGH',
    status: 'TODO',
    projectId: 'proj-cloud',
    projectName: 'Oracle Cloud PM',
    sprintId: 'sprint-1',
    assigneeId: 'user-developer',
    assignee: mockTeamMembers[1].user,
    createdBy: mockTeamMembers[0].user,
    createdAt: '2026-06-02T09:00:00',
    dueDate: '2026-06-12',
    reworkCount: 0,
  },
  {
    id: 'task-b',
    title: 'Build KPI cards',
    description: 'Render totals and developer analytics in the KPI dashboard.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    projectId: 'proj-cloud',
    projectName: 'Oracle Cloud PM',
    sprintId: 'sprint-1',
    assigneeId: 'user-manager',
    assignee: mockTeamMembers[0].user,
    createdBy: mockTeamMembers[0].user,
    createdAt: '2026-06-03T11:00:00',
    dueDate: '2026-06-11',
    enteredInProgressAt: '2026-06-04T10:00:00',
    reworkCount: 0,
  },
  {
    id: 'task-c',
    title: 'Fix broken pipeline',
    description: 'Resolve CI failure after frontend dependency upgrade.',
    priority: 'HIGH',
    status: 'BLOCKED',
    projectId: 'proj-cloud',
    projectName: 'Oracle Cloud PM',
    sprintId: 'sprint-1',
    assigneeId: 'user-luis',
    assignee: mockTeamMembers[2].user,
    createdBy: mockTeamMembers[0].user,
    createdAt: '2026-06-05T14:30:00',
    dueDate: '2026-06-13',
    reworkCount: 1,
  },
  {
    id: 'task-d',
    title: 'Write Playwright smoke tests',
    description: 'Cover dashboard loading and core navigation.',
    priority: 'MEDIUM',
    status: 'DONE',
    projectId: 'proj-cloud',
    projectName: 'Oracle Cloud PM',
    sprintId: 'sprint-1',
    assigneeId: 'user-developer',
    assignee: mockTeamMembers[1].user,
    createdBy: mockTeamMembers[0].user,
    createdAt: '2026-06-01T08:00:00',
    completedAt: '2026-06-07T16:00:00',
    dueDate: '2026-06-10',
    reworkCount: 0,
  },
  {
    id: 'task-e',
    title: 'Review sprint burndown',
    description: 'Compare planned and completed scope with the team.',
    priority: 'LOW',
    status: 'TODO',
    projectId: 'proj-cloud',
    projectName: 'Oracle Cloud PM',
    sprintId: 'sprint-1',
    assigneeId: 'user-manager',
    assignee: mockTeamMembers[0].user,
    createdBy: mockTeamMembers[0].user,
    createdAt: '2026-06-06T09:30:00',
    dueDate: '2026-06-13',
    reworkCount: 0,
  },
];

export const mockCompletedTasks = mockTasks.filter((task) => task.status === 'DONE');

export const mockAnalyticsSummary: AnalyticsSummary = {
  sprintId: 'sprint-1',
  avgCycleTimeDays: 2.5,
  cycleTimeChangePct: -10,
};

export const mockDeveloperStats: DeveloperAnalytics[] = [
  {
    email: TEST_USERS.manager.email,
    totalAssigned: 2,
    tasksCompleted: 1,
    totalHoursWorked: 6,
  },
  {
    email: TEST_USERS.developer.email,
    totalAssigned: 2,
    tasksCompleted: 2,
    totalHoursWorked: 8.5,
  },
  {
    email: 'a01644423@tec.mx',
    totalAssigned: 1,
    tasksCompleted: 0,
    totalHoursWorked: 2,
  },
];

export const mockPreviousSprintDeveloperStats: DeveloperAnalytics[] = [
  {
    email: TEST_USERS.manager.email,
    totalAssigned: 2,
    tasksCompleted: 2,
    totalHoursWorked: 7,
  },
  {
    email: TEST_USERS.developer.email,
    totalAssigned: 2,
    tasksCompleted: 2,
    totalHoursWorked: 6.5,
  },
];

export const mockAnalyticsDownload: MockDownload = {
  filename: 'oracle-cloud-pm-sprint-5-analytics.csv',
  contentType: 'text/csv',
  body:
    'developer,tasksCompleted,totalHoursWorked\n' +
    'a01639866@tec.mx,1,6\n' +
    'a01644875@tec.mx,2,8.5\n',
};
