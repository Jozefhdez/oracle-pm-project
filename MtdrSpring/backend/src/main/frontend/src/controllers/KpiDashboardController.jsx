import { useState, useEffect } from 'react';
import { useMutation, useQueries } from '@tanstack/react-query';
import { useActiveProject } from '../models/ProjectContext';
import { useSprints } from '../models/hooks/useSprints';
import { useDeveloperStats } from '../models/hooks/useDeveloperStats';
import { useCurrentUser } from '../models/CurrentUserContext';
import { fetchDeveloperStats, generateKpiInsight } from '../models/api/kpiApi';
import KpiDashboardView from '../views/kpi/KpiDashboardView';

const STORAGE_KEY = 'kpiSelectedSprintId';
const DEVELOPER_FILTER_STORAGE_KEY = 'kpiSelectedDeveloper';

function pickDefaultSprint(sprints) {
  if (!sprints.length) return null;
  return (
    sprints.find((s) => s.status === 'ACTIVE') ??
    sprints.find((s) => s.status === 'COMPLETED') ??
    sprints[sprints.length - 1]
  );
}

export default function KpiDashboardController() {
  const { activeProject } = useActiveProject();
  const { currentUser } = useCurrentUser();
  const [sprintId, setSprintId] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [developerFilter, setDeveloperFilter] = useState(
    () => localStorage.getItem(DEVELOPER_FILTER_STORAGE_KEY) ?? 'all'
  );
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiInsight, setAiInsight] = useState('');

  const { data: sprints = [] } = useSprints(activeProject?.id);
  const isAllSprints = sprintId === 'all';
  const effectiveSprintId = isAllSprints ? null : sprintId;
  const selectedSprint = isAllSprints ? null : sprints.find((s) => s.id === sprintId);

  const { data: developerStats = [], isLoading: loadingStats } =
    useDeveloperStats(effectiveSprintId);

  const allSprintQueries = useQueries({
    queries: sprints.map((s) => ({
      queryKey: ['developerStats', s.id],
      queryFn: () => fetchDeveloperStats(s.id),
      enabled: isAllSprints,
    })),
  });

  const allSprintsStats = sprints.map((s, i) => ({
    sprint: s,
    developerStats: allSprintQueries[i]?.data ?? [],
  }));

  const loadingAllSprints = isAllSprints && allSprintQueries.some((q) => q.isLoading);

  const insightMutation = useMutation({
    mutationFn: generateKpiInsight,
    onSuccess: (data) => {
      setAiInsight(data?.insight || 'No insight returned.');
    },
    onError: () => {
      setAiInsight('AI insight is unavailable right now. Try again in a moment.');
    },
  });

  useEffect(() => {
    setSprintId('');
    setDeveloperFilter('all');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEVELOPER_FILTER_STORAGE_KEY);
  }, [activeProject?.id]);

  useEffect(() => {
    if (sprintId || !sprints.length) return;
    const defaultSprint = pickDefaultSprint(sprints);
    if (defaultSprint) {
      setSprintId(defaultSprint.id);
      localStorage.setItem(STORAGE_KEY, defaultSprint.id);
    }
  }, [sprints, sprintId]);

  const handleSprintChange = (id) => {
    setSprintId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const handleDeveloperFilterChange = (email) => {
    setDeveloperFilter(email);
    localStorage.setItem(DEVELOPER_FILTER_STORAGE_KEY, email);
  };

  const buildAiContext = (question = '') => ({
    question: question.trim() || 'Summarize the current KPI dashboard and call out the main risk.',
    projectName: activeProject?.name ?? 'Unknown project',
    sprintScope: isAllSprints ? 'All Sprints' : selectedSprint?.name,
    developerFilter,
    currentUserEmail: currentUser?.email ?? null,
    visibleDeveloperStats: isAllSprints
      ? allSprintsStats.map(({ sprint, developerStats: stats }) => ({
          sprintName: sprint.name,
          developerStats:
            developerFilter === 'all'
              ? stats
              : stats.filter((developer) => developer.email === developerFilter),
        }))
      : developerFilter === 'all'
        ? developerStats
        : developerStats.filter((developer) => developer.email === developerFilter),
  });

  const handleOpenAi = () => {
    setAiOpen(true);
    if (!aiInsight && !insightMutation.isPending) {
      insightMutation.mutate(buildAiContext());
    }
  };

  const handleAskAi = () => {
    insightMutation.mutate(buildAiContext(aiQuestion));
  };

  return (
    <KpiDashboardView
      projectName={activeProject?.name}
      sprints={sprints}
      sprintId={sprintId}
      developerStats={developerStats}
      allSprintsStats={allSprintsStats}
      currentUserEmail={currentUser?.email ?? null}
      developerFilter={developerFilter}
      aiOpen={aiOpen}
      aiQuestion={aiQuestion}
      aiInsight={aiInsight}
      aiLoading={insightMutation.isPending}
      loadingStats={loadingStats || loadingAllSprints}
      onSprintChange={handleSprintChange}
      onDeveloperFilterChange={handleDeveloperFilterChange}
      onOpenAi={handleOpenAi}
      onCloseAi={() => setAiOpen(false)}
      onAiQuestionChange={setAiQuestion}
      onAskAi={handleAskAi}
    />
  );
}
