import { expect, test } from '@playwright/test';
import { ROUTES, TEST_USERS } from '../support/constants';
import { attachFailureScreenshot, downloadAnalyticsReport, login } from '../support/helpers';
import { mockAnalyticsDownload } from '../support/mock-data';
import {
  mockAuthRoutes,
  mockManagerRoutes,
  mockTaskRoutes,
  resetMockState,
} from '../support/routes';

test.describe('Manager Analytics @manager @analytics', () => {
  test.beforeAll(() => {});

  test.beforeEach(async ({ page }) => {
    resetMockState(page, 'manager');

    await mockAuthRoutes(page, { role: 'manager' });
    await mockManagerRoutes(page);
    await mockTaskRoutes(page);

    await login(page, TEST_USERS.manager);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await attachFailureScreenshot(page, testInfo);
  });

  test.afterAll(() => {});

  test('View Team Analytics with soft assertions @manager @analytics', async ({ page }) => {
    await test.step('Go to manager dashboard', async () => {
      await page.goto(ROUTES.DASHBOARD);
    });

    await test.step('Verify KPI cards are visible', async () => {
      const kpiCards = page.getByTestId('kpi-stat-cards');

      await expect.soft(kpiCards.getByText('Open Tasks')).toBeVisible();
      await expect.soft(kpiCards.getByText('Completed')).toBeVisible();
      await expect.soft(kpiCards.getByText('Blocked')).toBeVisible();

      await expect.soft(kpiCards).toContainText('4');
      await expect.soft(kpiCards).toContainText('1');
    });

    await test.step('Verify sprint health section', async () => {
      const sprintHealth = page.getByTestId('sprint-health-section');

      await expect.soft(sprintHealth.getByText('2 Todo')).toBeVisible();
      await expect.soft(sprintHealth.getByText('1 In Progress')).toBeVisible();
      await expect.soft(sprintHealth.getByText('1 Blocked')).toBeVisible();
      await expect.soft(sprintHealth.getByText('1 Done')).toBeVisible();
    });
  });

  test('Filter Analytics by team member @manager @analytics', async ({ page }) => {
    await test.step('Go to KPI dashboard', async () => {
      await page.goto(ROUTES.KPI);

      await expect(page.getByText('KPI Dashboard')).toBeVisible();
    });

    await test.step('Select a developer from the filter', async () => {
      await page.getByRole('combobox').nth(1).click();

      await page.getByRole('option', { name: TEST_USERS.developer.displayName }).click();
    });

    await test.step('Verify selected developer analytics', async () => {
      const selectedDeveloperCard = page.getByTestId('your-stats-card');

      await expect(
        selectedDeveloperCard.getByRole('heading', { name: 'Selected Developer' })
      ).toBeVisible();

      await expect(selectedDeveloperCard).toContainText('Tasks Completed');
      await expect(selectedDeveloperCard).toContainText('2');

      await expect(selectedDeveloperCard).toContainText('Hours Logged');
      await expect(selectedDeveloperCard).toContainText('8.5');

      await expect(page.getByText('Luis G.')).not.toBeVisible();
    });
  });

  test.skip('Download Analytics report @manager @analytics', async ({ page }) => {
    await page.goto(ROUTES.KPI);

    const download = await downloadAnalyticsReport(page);

    expect(download.suggestedFilename()).toBe(mockAnalyticsDownload.filename);
  });

  test('Snapshot Test for stable KPI dashboard @manager @analytics', async ({ page }) => {
    test.slow();

    await test.step('Go to KPI dashboard', async () => {
      await page.goto(ROUTES.KPI);

      await expect(page.getByText('Developer Performance')).toBeVisible();
    });

    await test.step('Take stable dashboard screenshot', async () => {
      const dashboard = page.locator('main');

      await expect(dashboard).toHaveScreenshot('manager-kpi-dashboard.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0.03,
      });
    });
  });
});
