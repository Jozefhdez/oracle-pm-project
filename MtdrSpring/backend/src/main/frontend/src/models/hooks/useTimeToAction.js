import { useQuery } from '@tanstack/react-query';
import { fetchTimeToAction } from '../api/kpiApi';

export const useTimeToAction = (sprintId) =>
  useQuery({
    queryKey: ['timeToAction', sprintId],
    queryFn: () => fetchTimeToAction(sprintId),
    enabled: !!sprintId,
  });
