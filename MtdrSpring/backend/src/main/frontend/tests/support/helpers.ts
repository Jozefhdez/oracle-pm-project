import type { Download, Locator, Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import { AUTH, ROUTES, STATUS_LABELS, TEST_USERS } from './constants';
import { buildOidcUser } from './routes';
import type { Task, TaskPriority, TaskStatus, UserCredentials } from './types';

export async function login(page: Page, credentials: UserCredentials = TEST_USERS.manager) {
  const oidcUser = buildOidcUser(credentials);

  await page.addInitScript(
    ({ storageKey, user, activeProject }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(user));
      window.sessionStorage.setItem(storageKey, JSON.stringify(user));
      window.localStorage.setItem('activeProject', JSON.stringify(activeProject));
    },
    {
      storageKey: AUTH.oidcStorageKey,
      user: oidcUser,
      activeProject: {
        id: 'proj-cloud',
        name: 'Oracle Cloud PM',
        description: 'Sprint planning and delivery dashboard for the Oracle PM course project.',
      },
    }
  );

  await page.goto(ROUTES.DASHBOARD);

  await expect(page.getByText(`Welcome back, ${credentials.displayName}`)).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sign Out' }).click();

  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
}

export async function expectToast(page: Page, message: string | RegExp) {
  await expect(page.getByText(message)).toBeVisible();
}

export async function openSprintBoard(page: Page) {
  await page.getByText('Sprints', { exact: true }).click();
  await page.getByText('Sprint 5 Quality Sprint', { exact: true }).click();

  await expect(page.getByRole('button', { name: 'Add Task' })).toBeVisible();
}

export async function createTask(
  page: Page,
  task: Pick<Task, 'title' | 'description'> & {
    priority?: TaskPriority;
    assignee?: string;
    dueDate?: string;
  }
) {
  await page.getByRole('button', { name: 'Add Task' }).click();

  await expect(page.getByTestId('add-task-dialog')).toBeVisible();

  await page.getByRole('textbox', { name: 'Title' }).fill(task.title);

  if (task.description) {
    await page.getByRole('textbox', { name: 'Description (optional)' }).fill(task.description);
  }

  if (task.priority) {
    await selectMuiOption(
      page.getByRole('combobox', { name: 'Priority' }),
      formatOption(task.priority)
    );
  }

  if (task.assignee) {
    await selectMuiOption(
      page.getByRole('combobox', { name: 'Assignee (optional)' }),
      task.assignee
    );
  }

  await page.getByRole('button', { name: 'Create Task' }).click();

  await expect(page.getByTestId('add-task-dialog')).not.toBeVisible();
  await expect(page.getByText(task.title)).toBeVisible();
}

export async function dragTaskToStatus(
  page: Page,
  taskTitle: string,
  status: TaskStatus,
  options: { hours?: string; note?: string } = {}
) {
  const source = getTaskCard(page, taskTitle);

  const target = page.getByTestId(`column-${status}`);

  await expect(source).toBeVisible();
  await expect(target).toBeVisible();

  await dragByMouse(page, source, target);

  if (status === 'DONE') {
    await expect(page.getByTestId('log-hours-dialog')).toBeVisible();

    await page.getByLabel('Hours worked').fill(options.hours ?? '2');

    if (options.note) {
      await page.getByLabel('Note (optional)').fill(options.note);
    }

    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByTestId('log-hours-dialog')).not.toBeVisible();
  }

  await expect(target.getByText(taskTitle)).toBeVisible();
}

export async function reassignTask(page: Page, taskTitle: string, assigneeName: string) {
  await getTaskCard(page, taskTitle).click();

  await expect(page.getByTestId('task-details-sidebar')).toBeVisible();

  await selectMuiOption(
    page.getByTestId('task-details-sidebar').getByRole('combobox'),
    assigneeName
  );

  await expect(page.getByTestId('task-details-sidebar').getByText(assigneeName)).toBeVisible();

  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await expect(page.getByText('Sprint 5 Quality Sprint')).toBeVisible();
}

export async function downloadAnalyticsReport(page: Page): Promise<Download> {
  const downloadPromise = page.waitForEvent('download');

  await page.getByRole('button', { name: /download analytics/i }).click();

  return downloadPromise;
}

function formatOption(priority: TaskPriority) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

async function selectMuiOption(select: Locator, optionName: string) {
  await select.click();
  await select.page().getByRole('option', { name: optionName }).click();
}

async function dragByMouse(page: Page, source: Locator, targetColumn: Locator) {
  const sourceBox = await source.boundingBox();
  const targetBox = await targetColumn.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Could not calculate drag source or target coordinates.');
  }

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;

  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + Math.min(targetBox.height - 16, 128);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 8, startY + 8, { steps: 4 });
  await page.mouse.move(endX, endY, { steps: 24 });
  await page.mouse.up();
}

function getTaskCard(page: Page, taskTitle: string) {
  return page
    .getByText(taskTitle, { exact: true })
    .locator('xpath=ancestor::*[contains(@class, "MuiCard-root")][1]');
}

export function statusLabel(status: TaskStatus) {
  return STATUS_LABELS[status];
}

export async function attachFailureScreenshot(page: Page, testInfo: TestInfo) {
  if (testInfo.status === testInfo.expectedStatus) return;

  try {
    const screenshot = await page.screenshot({
      fullPage: true,
      timeout: 5_000,
    });

    await testInfo.attach('manual-failure-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  } catch (error) {
    await testInfo.attach('manual-failure-screenshot-error', {
      body: String(error),
      contentType: 'text/plain',
    });
  }
}
