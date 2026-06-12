import type { Page, Route } from '@playwright/test';
import { AUTH, BASE_URL, HAR_FILE, TEST_USERS } from './constants';
import {
  mockAnalyticsDownload,
  mockAnalyticsSummary,
  mockDeveloperLoginResponse,
  mockDeveloperStats,
  mockInvalidLoginResponse,
  mockManagerLoginResponse,
  mockPreviousSprintDeveloperStats,
  mockProjects,
  mockSprints,
  mockTasks,
  mockTeamMembers,
} from './mock-data';
import type { Task, TaskStatus, UserCredentials, UserRole } from './types';

let currentRole: UserRole = 'manager';
let currentTasks: Task[] = [...mockTasks];

function json(route: Route, data: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

function currentUser() {
  return currentRole === 'manager' ? mockTeamMembers[0].user : mockTeamMembers[1].user;
}

function getTaskIdFromUrl(url: string) {
  const pathname = new URL(url).pathname;
  return pathname.split('/')[2];
}

export function resetMockState(_page: Page, role: UserRole = 'manager') {
  currentRole = role;
  currentTasks = [...mockTasks];
}

export async function mockAuthRoutes(
  page: Page,
  options: {
    role?: UserRole;
    useHarForCurrentUser?: boolean;
  } = {}
) {
  currentRole = options.role ?? currentRole;

  if (options.useHarForCurrentUser) {
    await page.routeFromHAR(HAR_FILE, {
      url: `${BASE_URL}/users/me`,
      notFound: 'fallback',
    });
  }

  await page.route('**/users/me', async (route) => {
    if (options.useHarForCurrentUser) {
      return route.fallback();
    }

    return json(route, currentUser());
  });

  await page.route('**/users', async (route) => {
    return json(
      route,
      mockTeamMembers.map((member) => member.user)
    );
  });
}

export async function mockManagerRoutes(page: Page) {
  currentRole = 'manager';

  await page.route('**/projects/mine', async (route) => {
    return json(route, mockProjects);
  });

  await page.route('**/projects/proj-cloud', async (route) => {
    return json(route, mockProjects[0]);
  });

  await page.route('**/projects/proj-cloud/members', async (route) => {
    return json(route, mockTeamMembers);
  });

  await page.route('**/projects/proj-cloud/sprints', async (route) => {
    return json(route, mockSprints);
  });

  await page.route('**/sprints/sprint-1/kpi', async (route) => {
    return json(route, mockAnalyticsSummary);
  });

  await page.route('**/sprints/sprint-1/kpi/developer-stats', async (route) => {
    return json(route, mockDeveloperStats);
  });

  await page.route('**/sprints/sprint-0/kpi/developer-stats', async (route) => {
    return json(route, mockPreviousSprintDeveloperStats);
  });

  await page.route('**/projects/proj-cloud/kpi/cycle-time-trend', async (route) => {
    return json(route, [
      {
        sprintName: 'Sprint 4 Stabilization',
        avgCycleTimeDays: 3.1,
      },
      {
        sprintName: 'Sprint 5 Quality Sprint',
        avgCycleTimeDays: 2.5,
      },
    ]);
  });

  await page.route('**/projects/proj-cloud/kpi/report', async (route) => {
    return route.fulfill({
      status: 200,
      headers: {
        'content-type': mockAnalyticsDownload.contentType,
        'content-disposition': `attachment; filename="${mockAnalyticsDownload.filename}"`,
      },
      body: mockAnalyticsDownload.body,
    });
  });
}

export async function mockDeveloperRoutes(page: Page) {
  currentRole = 'developer';

  await page.route('**/projects/mine', async (route) => {
    return json(route, mockProjects);
  });

  await page.route('**/projects/proj-cloud', async (route) => {
    return json(route, mockProjects[0]);
  });

  await page.route('**/projects/proj-cloud/members', async (route) => {
    return json(route, mockTeamMembers);
  });

  await page.route('**/projects/proj-cloud/sprints', async (route) => {
    return json(route, mockSprints);
  });
}

export async function mockTaskRoutes(page: Page) {
  await page.route('**/sprints/sprint-1', async (route) => {
    return json(route, mockSprints[0]);
  });

  await page.route('**/sprints/sprint-1/tasks', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      return json(route, currentTasks);
    }

    if (request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');

      const createdTask: Task = {
        id: `task-created-${currentTasks.length + 1}`,
        title: body.title ?? 'Untitled task',
        description: body.description ?? '',
        priority: body.priority ?? 'MEDIUM',
        status: 'TODO',
        projectId: 'proj-cloud',
        projectName: 'Oracle Cloud PM',
        sprintId: 'sprint-1',
        assigneeId: body.assigneeId ?? null,
        assignee:
          mockTeamMembers.find((member) => member.user.id === body.assigneeId)?.user ?? null,
        createdBy: currentUser(),
        createdAt: '2026-06-11T12:00:00',
        dueDate: body.dueDate,
        reworkCount: 0,
      };

      currentTasks.push(createdTask);

      return json(route, createdTask, 201);
    }

    return json(route, { message: 'Method not allowed' }, 405);
  });

  await page.route('**/tasks/*/status', async (route) => {
    const request = route.request();
    const taskId = getTaskIdFromUrl(request.url());
    const task = currentTasks.find((item) => item.id === taskId);

    if (!task) {
      return json(route, { message: 'Task not found' }, 404);
    }

    const body = JSON.parse(request.postData() || '{}');
    task.status = (body.status ?? task.status) as TaskStatus;

    if (task.status === 'DONE') {
      task.completedAt = '2026-06-11T15:00:00';
    }

    return json(route, task);
  });

  await page.route('**/tasks/*/assignee', async (route) => {
    const request = route.request();
    const taskId = getTaskIdFromUrl(request.url());
    const task = currentTasks.find((item) => item.id === taskId);

    if (!task) {
      return json(route, { message: 'Task not found' }, 404);
    }

    const body = JSON.parse(request.postData() || '{}');

    task.assigneeId = body.assigneeId ?? null;
    task.assignee =
      mockTeamMembers.find((member) => member.user.id === body.assigneeId)?.user ?? null;

    return json(route, task);
  });

  await page.route('**/tasks/*/history', async (route) => {
    return json(route, []);
  });

  await page.route('**/tasks/*/work-logs', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      return json(route, []);
    }

    return json(route, {
      id: 'mock-work-log',
      user: currentUser(),
      workDate: '2026-06-11',
      hoursWorked: 2,
      note: 'Completed during E2E test.',
    });
  });

  await page.route('**/tasks/*', async (route) => {
    const request = route.request();
    const taskId = getTaskIdFromUrl(request.url());
    const task = currentTasks.find((item) => item.id === taskId);

    if (!task) {
      return json(route, { message: 'Task not found' }, 404);
    }

    return json(route, task);
  });
}

export async function mockIdentityProviderFailure(page: Page) {
  await page.route(`${AUTH.authority}/.well-known/openid-configuration`, async (route) => {
    return json(route, {
      issuer: AUTH.authority,
      authorization_endpoint: `${AUTH.authority}/oauth2/v1/authorize`,
      token_endpoint: `${AUTH.authority}/oauth2/v1/token`,
      userinfo_endpoint: `${AUTH.authority}/oauth2/v1/userinfo`,
      jwks_uri: `${AUTH.authority}/admin/v1/SigningCert/jwk`,
    });
  });

  await page.route(`${AUTH.authority}/oauth2/v1/authorize**`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <main>
          <h1>${mockInvalidLoginResponse.message}</h1>
          <p>Mocked Oracle Identity rejected these credentials.</p>
        </main>
      `,
    });
  });
}

export function buildOidcUser(credentials: UserCredentials) {
  const token =
    credentials.role === 'manager'
      ? mockManagerLoginResponse.accessToken
      : mockDeveloperLoginResponse.accessToken;

  const idToken =
    credentials.role === 'manager'
      ? mockManagerLoginResponse.idToken
      : mockDeveloperLoginResponse.idToken;

  return {
    id_token: idToken,
    access_token: token,
    token_type: 'Bearer',
    scope: 'openid profile email',
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    profile: {
      sub: credentials.role === 'manager' ? 'user-manager' : 'user-developer',
      email: credentials.email,
      name: credentials.displayName,
    },
  };
}
