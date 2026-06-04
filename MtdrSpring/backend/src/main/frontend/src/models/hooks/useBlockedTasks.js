import { useQuery } from '@tanstack/react-query';
import { fetchBlockedTasks } from '../api/kpiApi';

export const useBlockedTasks = (sprintId) =>
  useQuery({
    queryKey: ['blockedTasks', sprintId],
    queryFn: () => fetchBlockedTasks(sprintId),
    enabled: !!sprintId,
  });
