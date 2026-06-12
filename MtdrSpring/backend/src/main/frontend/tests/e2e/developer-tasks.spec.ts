import { expect, test } from '@playwright/test';
import { ROUTES, TEST_USERS } from '../support/constants';
import {
  attachFailureScreenshot,
  dragTaskToStatus,
  login,
  openSprintBoard,
} from '../support/helpers';
import {
  mockAuthRoutes,
  mockDeveloperRoutes,
  mockTaskRoutes,
  resetMockState,
} from '../support/routes';

test.describe('Developer Tasks @developer @tasks', () => {
  test.beforeAll(() => {});

  test.beforeEach(async ({ page }) => {
    resetMockState(page, 'developer');

    await mockAuthRoutes(page, { role: 'developer' });
    await mockDeveloperRoutes(page);
    await mockTaskRoutes(page);

    await login(page, TEST_USERS.developer);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await attachFailureScreenshot(page, testInfo);
  });

  test.afterAll(() => {});

  test('View Assigned Tasks count @developer @tasks', async ({ page }) => {
    await test.step('Go to the Kanban board', async () => {
      await page.goto(ROUTES.KANBAN);
    });

    await test.step('Verify assigned tasks for developer', async () => {
      const developerRow = page.getByTestId('user-row-user-developer');

      await expect(developerRow.getByText('Ana P. (2)')).toBeVisible();

      await expect.soft(developerRow.getByText('Implement login audit trail')).toBeVisible();

      await expect.soft(developerRow.getByText('Write Playwright smoke tests')).toBeVisible();
    });
  });

  test('Complete Task and log hours @developer @tasks', async ({ page }) => {
    test.slow();

    await test.step('Go to the sprint board', async () => {
      await openSprintBoard(page);
    });

    await test.step('Move task to DONE and log work hours', async () => {
      await dragTaskToStatus(page, 'Implement login audit trail', 'DONE', {
        hours: '3',
        note: 'Completed from developer E2E test.',
      });
    });

    await test.step('Verify task appears in DONE column', async () => {
      const doneColumn = page.getByTestId('column-DONE');

      await expect(doneColumn.getByText('Implement login audit trail')).toBeVisible();

      await expect(
        page.getByTestId('column-IN_PROGRESS').getByText('Implement login audit trail')
      ).not.toBeVisible();
    });
  });

  test('Completed Tasks list is visible @developer @tasks', async ({ page }) => {
    await test.step('Go to the sprint board', async () => {
      await openSprintBoard(page);
    });

    await test.step('Verify completed tasks are shown', async () => {
      const doneColumn = page.getByTestId('column-DONE');

      await expect(doneColumn.getByText('Write Playwright smoke tests')).toBeVisible();
      await expect(doneColumn.getByText('Medium')).toBeVisible();

      await expect(doneColumn.getByText('Build KPI cards')).not.toBeVisible();
    });
  });
});
