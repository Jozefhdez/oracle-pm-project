# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task-management.spec.ts >> Task Management @tasks @crud >> Testing column product gap is documented @tasks @crud
- Location: tests/e2e/task-management.spec.ts:111:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Testing')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Testing')

```

```yaml
- banner:
  - paragraph: Oracle Cloud PM
  - paragraph: Project Manager - a01639866@tec.mx
  - button "Go back to project selection": Switch Project
  - button "Sign Out"
- main:
  - button "Back to Sprints"
  - paragraph: Sprint 5 Quality Sprint
  - paragraph: Start
  - paragraph: Jun 1
  - paragraph: End
  - paragraph: Jun 14
  - paragraph: Planned
  - paragraph: 7 tasks
  - button "Add Task"
  - paragraph: To Do
  - paragraph: "1"
  - button "Review sprint burndown Low":
    - paragraph: Review sprint burndown
    - paragraph: Low
  - paragraph: In Progress
  - paragraph: "1"
  - button "Fix broken pipeline High":
    - paragraph: Fix broken pipeline
    - paragraph: High
  - paragraph: Blocked
  - paragraph: "1"
  - button "Build KPI cards Medium":
    - paragraph: Build KPI cards
    - paragraph: Medium
  - paragraph: Done
  - paragraph: "2"
  - button "Implement login audit trail High":
    - paragraph: Implement login audit trail
    - paragraph: High
  - button "Write Playwright smoke tests Medium":
    - paragraph: Write Playwright smoke tests
    - paragraph: Medium
  - status
- img
- paragraph: Dashboard
- img
- paragraph: Kanban Board
- img
- paragraph: Sprints
- img
- paragraph: KPIs
- img
- paragraph: Profile
- img
```

# Test source

```ts
  16  |   resetMockState,
  17  | } from '../support/routes';
  18  | 
  19  | test.describe('Task Management @tasks @crud', () => {
  20  |   test.beforeAll(() => {});
  21  | 
  22  |   test.beforeEach(async ({ page }) => {
  23  |     resetMockState(page, 'manager');
  24  |     await mockAuthRoutes(page, { role: 'manager' });
  25  |     await mockManagerRoutes(page);
  26  |     await mockTaskRoutes(page);
  27  |     await login(page, TEST_USERS.manager);
  28  |     await openSprintBoard(page);
  29  |   });
  30  | 
  31  |   test.afterEach(async ({ page }, testInfo) => {
  32  |     await attachFailureScreenshot(page, testInfo);
  33  |   });
  34  | 
  35  |   test.afterAll(() => {});
  36  | 
  37  |   test('Create 3 Tasks @tasks @crud', async ({ page }) => {
  38  |     const tasksToCreate = [
  39  |       {
  40  |         title: 'Task A - QA checklist',
  41  |         description: 'Prepare release checklist and review acceptance criteria.',
  42  |         assignee: 'Ana P.',
  43  |         priority: 'HIGH' as const,
  44  |         dueDate: '2026-06-12',
  45  |       },
  46  |       {
  47  |         title: 'Task B - Mock route audit',
  48  |         description: 'Confirm every API path is intercepted by Playwright.',
  49  |         assignee: 'Ana E.',
  50  |         priority: 'MEDIUM' as const,
  51  |         dueDate: '2026-06-13',
  52  |       },
  53  |       {
  54  |         title: 'Task C - Regression notes',
  55  |         description: 'Document regression coverage for the sprint demo.',
  56  |         assignee: 'Luis G.',
  57  |         priority: 'LOW' as const,
  58  |         dueDate: '2026-06-14',
  59  |       },
  60  |     ];
  61  | 
  62  |     for (const taskData of tasksToCreate) {
  63  |       await createTask(page, taskData);
  64  |       await expect(page.getByTestId('column-TODO').getByText(taskData.title)).toBeVisible();
  65  |     }
  66  |   });
  67  | 
  68  |   test('Modify 3 Tasks by reassigning owners @tasks @crud', async ({ page }) => {
  69  |     await reassignTask(page, 'Implement login audit trail', 'Ana E.');
  70  |     await reassignTask(page, 'Build KPI cards', 'Ana P.');
  71  |     await reassignTask(page, 'Fix broken pipeline', 'Ana P.');
  72  | 
  73  |     await expect(page.getByText('Sprint 5 Quality Sprint')).toBeVisible();
  74  |     await expect(
  75  |       page.getByTestId('column-TODO').getByText('Implement login audit trail')
  76  |     ).toBeVisible();
  77  |   });
  78  | 
  79  |   test('Change Status across real workflow columns @tasks @crud', async ({ page }) => {
  80  |     await dragTaskToStatus(page, 'Implement login audit trail', 'DONE', {
  81  |       hours: '2',
  82  |       note: 'Ready for release notes.',
  83  |     });
  84  |     await dragTaskToStatus(page, 'Build KPI cards', 'BLOCKED');
  85  |     await dragTaskToStatus(page, 'Fix broken pipeline', 'IN_PROGRESS');
  86  | 
  87  |     await expect(
  88  |       page.getByTestId('column-DONE').getByText('Implement login audit trail')
  89  |     ).toBeVisible();
  90  |     await expect(page.getByTestId('column-BLOCKED').getByText('Build KPI cards')).toBeVisible();
  91  |     await expect(
  92  |       page.getByTestId('column-IN_PROGRESS').getByText('Fix broken pipeline')
  93  |     ).toBeVisible();
  94  |   });
  95  | 
  96  |   test('Validation Scenario prevents invalid task creation @tasks @crud', async ({ page }) => {
  97  |     const createRequests: string[] = [];
  98  |     page.on('request', (request) => {
  99  |       if (request.method() === 'POST' && /\/sprints\/sprint-1\/tasks$/.test(request.url())) {
  100 |         createRequests.push(request.url());
  101 |       }
  102 |     });
  103 | 
  104 |     await page.getByRole('button', { name: 'Add Task' }).click();
  105 |     await page.getByRole('button', { name: 'Create Task' }).click();
  106 | 
  107 |     await expectToast(page, 'Title is required.');
  108 |     expect(createRequests).toHaveLength(0);
  109 |   });
  110 | 
  111 |   test('Testing column product gap is documented @tasks @crud', async ({ page }) => {
  112 |     test.fail(
  113 |       true,
  114 |       'The Sprint 5 prompt asks for Testing, but the real app exposes Blocked instead.'
  115 |     );
> 116 |     await expect(page.getByText('Testing')).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
  117 |   });
  118 | });
  119 | 
```