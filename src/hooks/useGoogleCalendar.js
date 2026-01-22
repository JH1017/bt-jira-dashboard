import { useQuery } from '@tanstack/react-query';
import { getCalendarEventsByDateRange, setAccessToken } from '../services/googleCalendarApi';

// viewMode에 따라 이벤트 가져오기
export const useGoogleCalendar = (accessToken, viewMode = 'day') => {
  return useQuery({
    queryKey: ['googleCalendar', accessToken, viewMode],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('액세스 토큰이 필요합니다.');
      }
      
      // 토큰 설정
      setAccessToken(accessToken);
      
      // 한국 시간 기준으로 오늘 00:00:00 설정
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const today = new Date(koreaTime);
      today.setHours(0, 0, 0, 0);
      
      let startDate = new Date(today);
      let endDate = new Date(today);
      
      // viewMode에 따라 날짜 범위 설정
      if (viewMode === 'day') {
        // 당일만
        endDate.setDate(endDate.getDate() + 1); // 다음날 00:00
      } else if (viewMode === 'week') {
        // 주별: 오늘부터 일주일
        endDate.setDate(endDate.getDate() + 7);
      } else if (viewMode === 'month') {
        // 월별: 이번 달 1일부터 마지막 날까지
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // 첫 주의 시작일 찾기 (일요일)
        const firstDayOfWeek = monthStart.getDay();
        startDate = new Date(monthStart);
        startDate.setDate(monthStart.getDate() - firstDayOfWeek); // 전월 마지막 주 일요일부터
        
        // 마지막 주의 종료일 찾기 (토요일)
        const lastDayOfWeek = monthEnd.getDay();
        endDate = new Date(monthEnd);
        endDate.setDate(monthEnd.getDate() + (6 - lastDayOfWeek)); // 다음 달 첫 주 토요일까지
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      const maxResults = 250;
      
      return await getCalendarEventsByDateRange(startDate, endDate, maxResults);
    },
    enabled: !!accessToken, // 토큰이 있을 때만 활성화
    refetchInterval: 5 * 60 * 1000, // 5분마다 갱신
    staleTime: 3 * 60 * 1000,
    retry: false,
  });
};