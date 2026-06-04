import client from './client';

export const fetchKpi = (sprintId) => client.get(`/sprints/${sprintId}/kpi`).then((r) => r.data);

export const fetchDeveloperStats = (sprintId) =>
  client.get(`/sprints/${sprintId}/kpi/developer-stats`).then((r) => r.data);

export const fetchAgingWip = (sprintId) =>
  client.get(`/sprints/${sprintId}/kpi/aging-wip`).then((r) => r.data);

export const fetchBlockedTasks = (sprintId) =>
  client.get(`/sprints/${sprintId}/kpi/blocked-tasks`).then((r) => r.data);

export const fetchTimeToAction = (sprintId) =>
  client.get(`/sprints/${sprintId}/kpi/time-to-action`).then((r) => r.data);

export const fetchBotAdoption = (sprintId) =>
  client.get(`/sprints/${sprintId}/kpi/bot-adoption`).then((r) => r.data);

export const fetchCycleTimeTrend = (projectId) =>
  client.get(`/projects/${projectId}/kpi/cycle-time-trend`).then((r) => r.data);
