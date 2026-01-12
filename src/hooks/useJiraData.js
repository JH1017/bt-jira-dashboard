import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDelayedIssues, getAllIssues, getIssueStats, DEFAULT_QUERIES } from '../services/jiraApi';

// 1페이지 - 지연 건
export const useDelayedIssues = () => {
  return useQuery({
    queryKey: ['delayedIssues'],
    queryFn: getDelayedIssues,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });
};

// 2페이지 - 전체 건
export const useAllIssues = () => {
  return useQuery({
    queryKey: ['allIssues'],
    queryFn: getAllIssues,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });
};

// 통계 (쿼리 파라미터 받음)
export const useJiraStats = (queries = DEFAULT_QUERIES) => {
  return useQuery({
    queryKey: ['jiraStats', queries],
    queryFn: () => getIssueStats(queries),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });
};

// 캐시 무효화 훅
export const useRefreshStats = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries(['jiraStats']);
  };
};
