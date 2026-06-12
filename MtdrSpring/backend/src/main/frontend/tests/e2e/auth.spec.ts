import { expect, test } from '@playwright/test';
import { AUTH, ROUTES, TEST_USERS } from '../support/constants';
import { attachFailureScreenshot, login, logout } from '../support/helpers';
import {
  mockAuthRoutes,
  mockDeveloperRoutes,
  mockIdentityProviderFailure,
  mockManagerRoutes,
  mockTaskRoutes,
  resetMockState,
} from '../support/routes';

test.describe('Authentication @auth', () => {
  test.beforeAll(() => {});

  test.beforeEach(async ({ page }) => {
    resetMockState(page, 'manager');

    await mockAuthRoutes(page, { role: 'manager' });
    await mockManagerRoutes(page);
    await mockTaskRoutes(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await attachFailureScreenshot(page, testInfo);
  });

  test.afterAll(() => {});

  test('Invalid Login Then Valid Login @auth', async ({ page }) => {
    await mockIdentityProviderFailure(page);

    await test.step('Go to login page', async () => {
      await page.goto(ROUTES.LOGIN);

      await expect(page.getByText('Sign in to Oracle')).toBeVisible();
    });

    await test.step('Try to login with invalid credentials', async () => {
      await page.getByRole('button', { name: 'Next' }).click();

      await expect(page.getByText('Invalid credentials')).toBeVisible();

      await expect(page.getByText(/Welcome back/)).not.toBeVisible();
    });

    await test.step('Login with valid manager credentials', async () => {
      await login(page, TEST_USERS.manager);

      await expect(page.getByText(`Project Manager - ${TEST_USERS.manager.email}`)).toBeVisible();

      await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
    });
  });

  const loginScenarios = [TEST_USERS.manager, TEST_USERS.developer];

  for (const credentials of loginScenarios) {
    test(`Parameterized Login for ${credentials.displayName} @auth`, async ({ page }) => {
      resetMockState(page, credentials.role);

      await mockAuthRoutes(page, { role: credentials.role });

      if (credentials.role === 'manager') {
        await mockManagerRoutes(page);
      } else {
        await mockDeveloperRoutes(page);
      }

      await mockTaskRoutes(page);

      await test.step(`Login as ${credentials.role}`, async () => {
        await login(page, credentials);
      });

      await test.step('Verify correct dashboard is displayed', async () => {
        const roleLabel = credentials.role === 'manager' ? 'Project Manager' : 'Developer';

        await expect(page.getByText(`${roleLabel} - ${credentials.email}`)).toBeVisible();

        await expect.soft(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
      });
    });
  }

  test('Session Isolation starts with clean storage and can use HAR auth mock @auth', async ({
    page,
  }) => {
    resetMockState(page, 'manager');

    await mockAuthRoutes(page, {
      role: 'manager',
      useHarForCurrentUser: true,
    });

    await mockManagerRoutes(page);
    await mockTaskRoutes(page);

    await test.step('Verify browser storage is clean before login', async () => {
      await page.goto(ROUTES.LOGIN);

      const activeProjectBeforeLogin = await page.evaluate(() =>
        localStorage.getItem('activeProject')
      );

      const oidcUserBeforeLogin = await page.evaluate(
        (key) => localStorage.getItem(key),
        AUTH.oidcStorageKey
      );

      expect(activeProjectBeforeLogin).toBeNull();
      expect(oidcUserBeforeLogin).toBeNull();
    });

    await test.step('Login using mocked HAR user data', async () => {
      await login(page, TEST_USERS.manager);

      await expect(page.getByText('Welcome back, Ana E.')).toBeVisible();
    });

    await test.step('Logout and verify login page appears again', async () => {
      await logout(page);

      await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    });
  });

  test('Clock API demonstration freezes browser time @auth @clock', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2025-06-01T10:00:00Z'));

    await page.goto(ROUTES.LOGIN);

    await expect(page.getByText('Sign in to Oracle')).toBeVisible();

    const browserTime = await page.evaluate(() => new Date().toISOString());

    expect(browserTime).toBe('2025-06-01T10:00:00.000Z');
  });

  test.skip('Example skipped auth test @auth', async () => {});
});
