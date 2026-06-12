import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../support/constants';
import {
  attachFailureScreenshot,
  createTask,
  dragTaskToStatus,
  expectToast,
  login,
  openSprintBoard,
  reassignTask,
} from '../support/helpers';
import {
  mockAuthRoutes,
  mockManagerRoutes,
  mockTaskRoutes,
  resetMockState,
} from '../support/routes';

test.describe('Task Management @tasks @crud', () => {
  test.beforeAll(() => {});

  test.beforeEach(async ({ page }) => {
    resetMockState(page, 'manager');
    await mockAuthRoutes(page, { role: 'manager' });
    await mockManagerRoutes(page);
    await mockTaskRoutes(page);
    await login(page, TEST_USERS.manager);
    await openSprintBoard(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await attachFailureScreenshot(page, testInfo);
  });

  test.afterAll(() => {});

  test('Create 3 Tasks @tasks @crud', async ({ page }) => {
    const tasksToCreate = [
      {
        title: 'Task A - QA checklist',
        description: 'Prepare release checklist and review acceptance criteria.',
        assignee: 'Ana P.',
        priority: 'HIGH' as const,
        dueDate: '2026-06-12',
      },
      {
        title: 'Task B - Mock route audit',
        description: 'Confirm every API path is intercepted by Playwright.',
        assignee: 'Ana E.',
        priority: 'MEDIUM' as const,
        dueDate: '2026-06-13',
      },
      {
        title: 'Task C - Regression notes',
        description: 'Document regression coverage for the sprint demo.',
        assignee: 'Luis G.',
        priority: 'LOW' as const,
        dueDate: '2026-06-14',
      },
    ];

    for (const taskData of tasksToCreate) {
      await createTask(page, taskData);
      await expect(page.getByTestId('column-TODO').getByText(taskData.title)).toBeVisible();
    }
  });

  test('Modify 3 Tasks by reassigning owners @tasks @crud', async ({ page }) => {
    await reassignTask(page, 'Implement login audit trail', 'Ana E.');
    await reassignTask(page, 'Build KPI cards', 'Ana P.');
    await reassignTask(page, 'Fix broken pipeline', 'Ana P.');

    await expect(page.getByText('Sprint 5 Quality Sprint')).toBeVisible();
    await expect(
      page.getByTestId('column-TODO').getByText('Implement login audit trail')
    ).toBeVisible();
  });

  test('Change Status across real workflow columns @tasks @crud', async ({ page }) => {
    await dragTaskToStatus(page, 'Implement login audit trail', 'DONE', {
      hours: '2',
      note: 'Ready for release notes.',
    });
    await dragTaskToStatus(page, 'Build KPI cards', 'BLOCKED');
    await dragTaskToStatus(page, 'Fix broken pipeline', 'IN_PROGRESS');

    await expect(
      page.getByTestId('column-DONE').getByText('Implement login audit trail')
    ).toBeVisible();
    await expect(page.getByTestId('column-BLOCKED').getByText('Build KPI cards')).toBeVisible();
    await expect(
      page.getByTestId('column-IN_PROGRESS').getByText('Fix broken pipeline')
    ).toBeVisible();
  });

  test('Validation Scenario prevents invalid task creation @tasks @crud', async ({ page }) => {
    const createRequests: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && /\/sprints\/sprint-1\/tasks$/.test(request.url())) {
        createRequests.push(request.url());
      }
    });

    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expectToast(page, 'Title is required.');
    expect(createRequests).toHaveLength(0);
  });

  test('Testing column product gap is documented @tasks @crud', async ({ page }) => {
    test.fail(
      true,
      'The Sprint 5 prompt asks for Testing, but the real app exposes Blocked instead.'
    );
    await expect(page.getByText('Testing')).toBeVisible();
  });
});
