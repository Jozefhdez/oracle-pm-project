import { useQuery } from '@tanstack/react-query';
import { fetchCycleTimeTrend } from '../api/kpiApi';

export const useCycleTimeTrend = (projectId) =>
  useQuery({
    queryKey: ['cycleTimeTrend', projectId],
    queryFn: () => fetchCycleTimeTrend(projectId),
    enabled: !!projectId,
  });
