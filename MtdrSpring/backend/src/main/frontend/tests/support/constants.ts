import type { TaskStatus, UserCredentials } from './types';

export const BASE_URL = 'http://127.0.0.1:3000';

export const ROUTES = {
  LOGIN: '/auth/sign-in',
  CALLBACK: '/callback',
  PROJECTS: '/projects',
  DASHBOARD: '/dashboard',
  KPI: '/kpi',
  KANBAN: '/kanban',
  PROFILE: '/profile',
  SPRINT_BOARD: '/projects/proj-cloud/sprints/sprint-1',
  taskDetail: (taskId: string) => `/tasks/${taskId}`,
} as const;

export const TEST_USERS = {
  manager: {
    email: 'a01639866@tec.mx',
    password: 'ManagerPass!23',
    role: 'manager',
    displayName: 'Ana E.',
    systemRole: 'PROJECT_MANAGER',
  },
  developer: {
    email: 'a01644875@tec.mx',
    password: 'DeveloperPass!23',
    role: 'developer',
    displayName: 'Ana P.',
    systemRole: 'DEVELOPER',
  },
  invalid: {
    email: 'wrong.user@tec.mx',
    password: 'wrong-password',
    role: 'developer',
    displayName: 'Invalid User',
    systemRole: 'DEVELOPER',
  },
} satisfies Record<string, UserCredentials>;

export const TIMEOUTS = {
  short: 5_000,
  medium: 10_000,
  long: 30_000,
} as const;

export const AUTH = {
  authority: 'https://idcs-a333fea8b68e4aff8867ff6094453a03.identity.oraclecloud.com',
  clientId: '7809ed300a374eafa7bb9403f8f1ff01',
  oidcStorageKey:
    'oidc.user:https://idcs-a333fea8b68e4aff8867ff6094453a03.identity.oraclecloud.com:7809ed300a374eafa7bb9403f8f1ff01',
} as const;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

export const API_PATH_PATTERN = /\/(users|projects|sprints|tasks|kpi)(\/|$)/;

export const HAR_FILE = 'tests/support/users-me.har';
