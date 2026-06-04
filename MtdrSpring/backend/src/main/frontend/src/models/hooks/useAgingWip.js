import { useQuery } from '@tanstack/react-query';
import { fetchAgingWip } from '../api/kpiApi';

export const useAgingWip = (sprintId) =>
  useQuery({
    queryKey: ['agingWip', sprintId],
    queryFn: () => fetchAgingWip(sprintId),
    enabled: !!sprintId,
  });
