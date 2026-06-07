# Final Demo Guide - Oracle PM Tool

## Pre-demo setup

- Open the deployed app and sign in before the timer starts.
- Select `Oracle Project Management Tool` as the active project.
- Use `Sprint 4 - Devops Setup` or the current active sprint.
- Make sure at least one developer account is linked to Telegram from `Profile & Settings`.
- Prepare one task title that is easy to search, for example: `Final demo task`.
- Keep Telegram open with the linked developer chat.

## Demo flow

1. **Dashboard 1: KPIs without filters**
   - Open `KPIs`.
   - Select `All Sprints`.
   - Set `Developer` to `All Developers`.
   - Show total tasks, total real hours, developer charts, and project KPIs.

2. **Filter by one developer**
   - Change the `Developer` filter to one teammate.
   - Point out that the totals, personal stats, charts, bot adoption, and tables update to that developer.

3. **Create and assign a new task**
   - Go to `Sprints`.
   - Open the active sprint board.
   - Create a task named `Final demo task`.
   - Assign it to the developer you selected in the KPI filter.
   - Leave it in `To Do` or move it to `In Progress`.

4. **Show the task from Telegram**
   - In Telegram, use the linked developer account.
   - Run: `/status Final demo task`
   - If the title search is slow, run `/status Sprint 4` and show the task in the sprint result.

5. **Finish the task with real time**
   - Recommended path: in the web sprint board, drag the task to `Done`.
   - When the log-hours dialog opens, enter a real time value like `1.5`.
   - Confirm so the app records both the status change and real hours.
   - Telegram alternative: `/loghours 1.5 Final demo task`, then `/updatestatus DONE Final demo task`.

6. **Show updated dashboard**
   - Return to `Dashboard` and `KPIs`.
   - Refresh if needed.
   - Show that completed tasks, hours, and developer indicators changed.
   - Re-select the same developer filter to show the focused update.

7. **Mention other relevant features only**
   - OIDC login with Oracle IAM.
   - Kanban workload grouped by developer.
   - Sprint health overview.
   - Automated tests, health checks, rollback, and OCI Notifications in the DevOps pipeline.
   - HTTPS deployment on OCI OKE with Oracle ATP wallet secrets.

8. **Show the AI feature**
   - In Telegram, run `/llm`.
   - Explain that Gemini is used for the bot parser/assistant behavior.
   - If there is time, try a natural-language request like: `show me the status of Sprint 4`.

## Avoid during the demo

- Do not show dependency reports, code coverage details, raw Kubernetes YAML, or CI logs unless asked.
- Do not explain implementation gaps such as server-side role enforcement unless asked directly.
- Do not spend time on deployment internals; just mention the production-style DevOps flow.

## Backup plan

- If Telegram is slow, show the task assigned in the web app and mention the exact bot command.
- If Gemini is slow, show `/llm` once and move on.
- If KPI data does not refresh immediately, refresh the browser or switch filters once to trigger a refetch.
