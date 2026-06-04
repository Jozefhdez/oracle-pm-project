import { useQuery } from '@tanstack/react-query';
import { fetchBotAdoption } from '../api/kpiApi';

export const useBotAdoption = (sprintId) =>
  useQuery({
    queryKey: ['botAdoption', sprintId],
    queryFn: () => fetchBotAdoption(sprintId),
    enabled: !!sprintId,
  });
