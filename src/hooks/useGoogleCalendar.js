import { useQuery } from '@tanstack/react-query';
import { getCalendarEventsByDateRange, setAccessToken } from '../services/googleCalendarApi';

// ✅ 하루(24시간) 동안은 "신선한 데이터"로 간주 (자동 재호출 최소화)
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// viewMode에 따라 이벤트 가져오기
export const useGoogleCalendar = (accessToken, viewMode = 'day') => {
  return useQuery({
    queryKey: ['googleCalendar', accessToken, viewMode],

    queryFn: async () => {
      if (!accessToken) {
        throw new Error('액세스 토큰이 필요합니다.');
      }

      // 토큰 설정 (서비스 내부에서 Authorization 헤더 세팅하는 방식이면 유지)
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
        // 당일만: 오늘 00:00 ~ 내일 00:00
        endDate.setDate(endDate.getDate() + 1);
      } else if (viewMode === 'week') {
        // 주별: 오늘부터 7일
        endDate.setDate(endDate.getDate() + 7);
      } else if (viewMode === 'month') {
        // 월별: 달력 그리드(전월 마지막 주 ~ 다음달 첫 주) 범위
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const firstDayOfWeek = monthStart.getDay(); // 0:일 ~ 6:토
        startDate = new Date(monthStart);
        startDate.setDate(monthStart.getDate() - firstDayOfWeek);

        const lastDayOfWeek = monthEnd.getDay();
        endDate = new Date(monthEnd);
        endDate.setDate(monthEnd.getDate() + (6 - lastDayOfWeek));

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const maxResults = 250;
      return await getCalendarEventsByDateRange(startDate, endDate, maxResults);
    },

    enabled: !!accessToken, // 토큰 있을 때만 실행

    // "하루 1회" 호출
    refetchInterval: 12 * 60 * 60 * 1000,         // 5분마다 자동 갱신 끔
    staleTime: 12 * 60 * 60 * 1000,          // 하루 동안은 fresh -> 포커스/마운트로 재호출 거의 안 함
    refetchOnWindowFocus: false,    // 탭 다시 봐도 자동 갱신 안 함
    refetchOnReconnect: true,       // 네트워크 끊겼다 복구되면 갱신(원치 않으면 false)
    refetchOnMount: true,           // 화면 처음 들어올 때 1회는 가져오게(원치 않으면 false)

    retry: false,
  });
};
