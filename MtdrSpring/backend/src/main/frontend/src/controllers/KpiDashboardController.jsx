import { useState, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useActiveProject } from '../models/ProjectContext';
import { useSprints } from '../models/hooks/useSprints';
import { useDeveloperStats } from '../models/hooks/useDeveloperStats';
import { useCurrentUser } from '../models/CurrentUserContext';
import { fetchDeveloperStats } from '../models/api/kpiApi';
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

  const { data: sprints = [] } = useSprints(activeProject?.id);
  const isAllSprints = sprintId === 'all';
  const effectiveSprintId = isAllSprints ? null : sprintId;

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

  return (
    <KpiDashboardView
      projectName={activeProject?.name}
      sprints={sprints}
      sprintId={sprintId}
      developerStats={developerStats}
      allSprintsStats={allSprintsStats}
      currentUserEmail={currentUser?.email ?? null}
      developerFilter={developerFilter}
      loadingStats={loadingStats || loadingAllSprints}
      onSprintChange={handleSprintChange}
      onDeveloperFilterChange={handleDeveloperFilterChange}
    />
  );
}
