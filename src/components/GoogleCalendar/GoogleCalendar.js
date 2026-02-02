import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Text, Flex, Button, VStack, HStack, Grid, 
  DialogRoot, DialogBackdrop, DialogPositioner, DialogContent, 
  DialogHeader, DialogTitle, DialogBody, CloseButton 
} from '@chakra-ui/react';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { initializeGoogleAPI } from '../../services/googleCalendarApi';

const GoogleCalendar = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  // localStorage에서 viewMode 불러오기 (없으면 'day' 기본값)
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('google_calendar_viewMode');
    return saved || 'day';
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const { data: events, refetch, isLoading: isFetching, error } = useGoogleCalendar(accessToken, viewMode);

  // ===== 추가: 하루에 한 번 로그인 시도 설정 =====
  const LOGIN_HOUR = 6; // 로그인 시도 시간 (0-23시, 예: 6 = 오전 6시)
  const LOGIN_MINUTE = 0; // 로그인 시도 분 (0-59)

  // 오늘 이미 로그인 시도했는지 확인
  const hasTriedLoginToday = () => {
    const lastLoginAttempt = localStorage.getItem('google_calendar_last_login_attempt');
    if (!lastLoginAttempt) return false;
    
    const lastAttemptDate = new Date(lastLoginAttempt);
    const today = new Date();
    
    // 같은 날짜인지 확인
    return lastAttemptDate.getDate() === today.getDate() &&
           lastAttemptDate.getMonth() === today.getMonth() &&
           lastAttemptDate.getFullYear() === today.getFullYear();
  };

  // 로그인 시도 시간 기록
  const recordLoginAttempt = () => {
    localStorage.setItem('google_calendar_last_login_attempt', new Date().toISOString());
  };

  // 다음 로그인 시도 시간 계산
  const getNextLoginTime = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(LOGIN_HOUR, LOGIN_MINUTE, 0, 0);
    
    // 오늘의 로그인 시간이 지났으면 내일로 설정
    if (now >= next) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  };

  // 현재 시간이 로그인 시도 시간인지 확인
  const isLoginTime = () => {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(LOGIN_HOUR, LOGIN_MINUTE, 0, 0);
    
    // 현재 시간이 목표 시간의 ±5분 이내인지 확인
    const diff = Math.abs(now - targetTime);
    return diff < 5 * 60 * 1000; // 5분 = 300,000ms
  };

// 디버깅: events 데이터 상세 확인
  useEffect(() => {
    if (events && events.length > 0) {
      console.log('=== Google Calendar Events 상세 디버깅 ===');
      console.log('총 이벤트 개수:', events.length);
      
      events.forEach((event, index) => {
        console.log(`\n이벤트 [${index}]:`, event.summary);
        console.log('  - start 객체:', event.start);
        console.log('  - start.dateTime:', event.start?.dateTime);
        console.log('  - start.date:', event.start?.date);
        console.log('  - start.timeZone:', event.start?.timeZone);
        console.log('  - end 객체:', event.end);
        console.log('  - end.dateTime:', event.end?.dateTime);
        console.log('  - end.date:', event.end?.date);
        console.log('  - end.timeZone:', event.end?.timeZone);
        
        const hasDateTime = !!event.start?.dateTime;
        const hasDateOnly = !!event.start?.date && !event.start?.dateTime;
        console.log('  - 시간 이벤트?', hasDateTime);
        console.log('  - 종일 이벤트?', hasDateOnly);
      });
      
      const timeEvents = events.filter(e => e.start?.dateTime);
      const allDayEvents = events.filter(e => e.start?.date && !e.start?.dateTime);
      console.log('\n=== 요약 ===');
      console.log('시간 이벤트:', timeEvents.length, '개');
      console.log('종일 이벤트:', allDayEvents.length, '개');
      
      if (timeEvents.length > 0) {
        console.log('\n시간 이벤트 샘플:');
        timeEvents.slice(0, 3).forEach(e => {
          console.log('  -', e.summary, ':', e.start?.dateTime, '~', e.end?.dateTime);
        });
      }
    } else {
      console.log('이벤트가 없습니다. events:', events);
    }
  }, [events]);


  // viewMode 변경 시 localStorage에 저장
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('google_calendar_viewMode', mode);
  };

  // 자동 슬라이드: 일별 -> 주별 -> 월별 -> 일별
  useEffect(() => {
    if (!accessToken) return; // 로그인 전에는 슬라이드 안함
    
    const viewModes = ['day', 'week', 'month'];
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setViewMode(prev => {
          const currentIndex = viewModes.indexOf(prev);
          const nextIndex = (currentIndex + 1) % viewModes.length;
          const nextMode = viewModes[nextIndex];
          localStorage.setItem('google_calendar_viewMode', nextMode);
          return nextMode;
        });
        setIsVisible(true);
      }, 500);
    }, 60000); // 60초마다 전환

    return () => clearInterval(interval);
  }, [accessToken]);

  // ... existing code (초기화, 로그인, 로그아웃, 유틸 함수들) ...

  // 컴포넌트 마운트 시 Google API 초기화
  useEffect(() => {
    const init = async () => {
      try {
        setInitError(null);
        setIsInitializing(true);
        await initializeGoogleAPI();
      } catch (error) {
        console.error('Google API 초기화 실패:', error);
        setInitError(error.message || 'Google API 초기화에 실패했습니다.');
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // 로컬 스토리지에서 토큰 확인 및 만료 시간 체크
  useEffect(() => {
    const savedToken = localStorage.getItem('google_calendar_token');
    const savedExpiresAt = localStorage.getItem('google_calendar_expires_at');
    
    if (savedToken && savedExpiresAt) {
      const expiresAt = Number(savedExpiresAt);
      const now = Date.now();
      
      // 실제로 만료되었을 때만 토큰 제거
      if (now >= expiresAt) {
        localStorage.removeItem('google_calendar_token');
        localStorage.removeItem('google_calendar_expires_at');
        setSessionExpired(true);
      } else {
        setAccessToken(savedToken);
      }
    }
  }, []);

  // 세션 만료 감지 (실제 401 에러만 처리)
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || '';
      // 실제 인증 에러만 세션 만료로 처리 (401, Unauthorized, 인증 만료 등)
      const isAuthError = 
        errorMessage.includes('인증이 만료되었습니다') || 
        errorMessage.includes('인증이 만료') || 
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized') ||
        (errorMessage.includes('인증') && errorMessage.includes('만료'));
      
      if (isAuthError) {
        setSessionExpired(true);
        setAccessToken(null);
        localStorage.removeItem('google_calendar_token');
        localStorage.removeItem('google_calendar_expires_at');
      }
    } else {
      setSessionExpired(false);
    }
  }, [error]);

  // Google 로그인 -> 구글 토큰은 1시간 내외로 만료돼서 만료시간 저장해두기
  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: (tokenResponse) => {
      // expires_in이 없으면 기본값 3600초(1시간) 사용
      const expiresIn = tokenResponse.expires_in || 3600;
      const expiresAt = Date.now() + expiresIn * 1000;

      setAccessToken(tokenResponse.access_token);
      localStorage.setItem('google_calendar_token', tokenResponse.access_token);
      localStorage.setItem('google_calendar_expires_at', expiresAt.toString());
      setSessionExpired(false); // 로그인 성공 시 세션 만료 상태 해제
      
      // 로그인 시도 기록
      recordLoginAttempt();
    },
    onError: (error) => {
      console.error('로그인 실패:', error);
      alert('구글 캘린더 로그인에 실패했습니다: ' + (error.error || '알 수 없는 오류'));
      
      // 로그인 실패해도 시도는 기록 (무한 재시도 방지)
      recordLoginAttempt();
    },
  });

  // 로그아웃
  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem('google_calendar_token');
    localStorage.removeItem('google_calendar_expires_at');
  };

  // ===== 수정: 하루에 한 번 특정 시간에만 자동 로그인 시도 =====
  useEffect(() => {
    // 토큰이 이미 있으면 자동 로그인 시도 안함
    if (accessToken) return;
    
    let isRefreshing = false;
    
    const checkAndLogin = () => {
      // 이미 오늘 로그인 시도했으면 건너뛰기
      if (hasTriedLoginToday()) {
        console.log('오늘 이미 로그인 시도함. 다음 시도 시간:', getNextLoginTime().toLocaleString('ko-KR'));
        return;
      }
      
      // 현재 시간이 로그인 시간이고, 아직 시도하지 않았으면 로그인 시도
      if (isLoginTime() && !isRefreshing) {
        console.log('자동 로그인 시도 시간입니다.');
        isRefreshing = true;
        
        try {
          login();
        } catch (error) {
          console.error('자동 로그인 실패:', error);
          isRefreshing = false;
        }
      }
    };
    
    // 즉시 한 번 체크
    checkAndLogin();
    
    // 1분마다 체크
    const interval = setInterval(checkAndLogin, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [accessToken, login]);

  // ===== 수정: 토큰 만료 시 자동 재로그인 시도 (하루 한 번 제한 적용) =====
  useEffect(() => {
    if (!accessToken) return;
    
    let isRefreshing = false;
    
    const checkTokenExpiry = () => {
      const savedExpiresAt = localStorage.getItem('google_calendar_expires_at');
      if (!savedExpiresAt) return;
      
      const expiresAt = Number(savedExpiresAt);
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      // 만료 직전(5분 전)에 자동으로 재로그인 시도
      // 단, 오늘 이미 로그인 시도했으면 건너뛰기
      if (timeUntilExpiry > 0 && timeUntilExpiry <= 5 * 60 * 1000 && !isRefreshing) {
        if (hasTriedLoginToday()) {
          console.log('토큰 만료 직전이지만 오늘 이미 로그인 시도함. 다음 시도:', getNextLoginTime().toLocaleString('ko-KR'));
          return;
        }
        
        console.log('토큰 만료 직전 - 자동 재로그인 시도...');
        isRefreshing = true;
        
        try {
          login();
        } catch (error) {
          console.error('자동 재로그인 실패:', error);
          isRefreshing = false;
        }
      }
      // 실제로 만료되었을 때만 세션 만료 처리
      else if (now >= expiresAt) {
        setSessionExpired(true);
        setAccessToken(null);
        localStorage.removeItem('google_calendar_token');
        localStorage.removeItem('google_calendar_expires_at');
      }
    };
    
    // 즉시 한 번 체크
    checkTokenExpiry();
    
    // 1분마다 체크
    const interval = setInterval(checkTokenExpiry, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [accessToken, login]);

  // 한국 시간 기준 오늘 날짜 가져오기
  const getKoreaToday = () => {
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    koreaTime.setHours(0, 0, 0, 0);
    return koreaTime;
  };

  // 날짜 문자열을 Date 객체로 변환 (한국 시간 기준)
  const parseKoreaDate = (dateString) => {
    if (!dateString) return null;
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    } else {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 시간 포맷팅
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 이벤트 색상 결정
  const getEventColor = (event) => {
    if (event.colorId) {
      const colors = {
        '1': 'blue',
        '2': 'green',
        '3': 'purple',
        '4': 'red',
        '5': 'yellow',
        '6': 'orange',
        '7': 'turquoise',
        '8': 'gray',
        '9': 'boldBlue',
        '10': 'boldGreen',
        '11': 'boldRed'
      };
      return colors[event.colorId] || 'gray';
    }
    return 'blue';
  };

  // 이벤트가 특정 날짜에 포함되는지 확인 (기간 일정 포함, 시간 이벤트 포함)
  const isEventOnDate = (event, targetDate) => {
    const startDateStr = event.start?.dateTime || event.start?.date;
    const endDateStr = event.end?.dateTime || event.end?.date;
    
    if (!startDateStr) return false;

    const hasTime = !!event.start?.dateTime; // 시간이 있는 이벤트인지 확인
    
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    if (hasTime) {
      // 시간이 있는 이벤트: 시작 시간의 날짜에 포함되는지 확인
      const startDate = parseKoreaDate(startDateStr);
      if (!startDate) return false;
      
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      
      // 같은 날짜면 포함
      if (target.getTime() === startDay.getTime()) {
        return true;
      }
      
      // 멀티데이 이벤트인 경우 종료 날짜까지 확인
      if (endDateStr) {
        const endDate = parseKoreaDate(endDateStr);
        if (endDate) {
          const endDay = new Date(endDate);
          endDay.setHours(0, 0, 0, 0);
          
          // 종료일이 시작일과 다른 경우
          if (endDay > startDay) {
            endDay.setDate(endDay.getDate() - 1); // 종료일은 exclusive
            return target > startDay && target <= endDay;
          }
        }
      }
      
      return false;
    } else {
      // 종일 이벤트: 기존 로직
      const startDate = parseKoreaDate(startDateStr);
      const endDate = parseKoreaDate(endDateStr);
      
      if (!startDate || !endDate) return false;
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      
      return target >= start && target <= end;
    }
  };

  // 날짜별로 이벤트 그룹화 (기간 일정 포함, 시간 이벤트 포함)
  const eventsByDate = useMemo(() => {
    if (!events || events.length === 0) {
      console.log('eventsByDate: 이벤트가 없습니다.');
      return {};
    }

    const grouped = {};
    let timeEventCount = 0;
    let allDayEventCount = 0;

    events.forEach((event, index) => {
      const startDateStr = event.start?.dateTime || event.start?.date;
      if (!startDateStr) {
        console.warn(`이벤트 [${index}] startDateStr 없음:`, event);
        return;
      }

      const hasTime = !!event.start?.dateTime; // 시간이 있는 이벤트인지 확인
      
      if (hasTime) {
        timeEventCount++;
        console.log(`시간 이벤트 [${index}]:`, event.summary, 'start:', startDateStr);
        
        // 시간이 있는 이벤트: 시작 시간의 날짜에 추가
        const startDate = parseKoreaDate(startDateStr);
        if (!startDate) {
          console.warn('시간 이벤트 파싱 실패:', event.summary, startDateStr);
          return;
        }
        
        const startDay = new Date(startDate);
        startDay.setHours(0, 0, 0, 0);
        
        // 한국 시간 기준으로 날짜 키 생성
        const year = startDay.getFullYear();
        const month = String(startDay.getMonth() + 1).padStart(2, '0');
        const day = String(startDay.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        
        console.log('  -> 날짜 키:', dateKey);
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
        
        // 멀티데이 이벤트인 경우 종료 날짜까지도 추가
        const endDateStr = event.end?.dateTime;
        if (endDateStr) {
          const endDate = parseKoreaDate(endDateStr);
          if (endDate) {
            const endDay = new Date(endDate);
            endDay.setHours(0, 0, 0, 0);
            
            // 종료일이 시작일과 다른 경우, 종료일 전날까지 추가
            if (endDay > startDay) {
              endDay.setDate(endDay.getDate() - 1); // 종료일은 exclusive
              const currentDate = new Date(startDay);
              currentDate.setDate(currentDate.getDate() + 1); // 시작일 다음날부터
              
              while (currentDate <= endDay) {
                const nextYear = currentDate.getFullYear();
                const nextMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
                const nextDay = String(currentDate.getDate()).padStart(2, '0');
                const nextDateKey = `${nextYear}-${nextMonth}-${nextDay}`;
                
                if (!grouped[nextDateKey]) {
                  grouped[nextDateKey] = [];
                }
                grouped[nextDateKey].push(event);
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }
          }
        }
      } else {
        allDayEventCount++;
        // 종일 이벤트: 기존 로직
        const startDate = parseKoreaDate(startDateStr);
        const endDateStr = event.end?.date || event.end?.dateTime;
        const endDate = parseKoreaDate(endDateStr);

        if (!startDate || !endDate) return;

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(event);
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    console.log('=== eventsByDate 그룹화 완료 ===');
    console.log('시간 이벤트:', timeEventCount, '개');
    console.log('종일 이벤트:', allDayEventCount, '개');
    console.log('그룹화된 날짜:', Object.keys(grouped).length, '개');

    // 날짜순으로 정렬
    const sortedDates = Object.keys(grouped).sort();
    const sortedGrouped = {};
    sortedDates.forEach(date => {
      sortedGrouped[date] = grouped[date].sort((a, b) => {
        // 시간이 있는 이벤트는 시간순으로, 종일 이벤트는 날짜순으로 정렬
        const timeA = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : (a.start?.date || '');
        const timeB = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : (b.start?.date || '');
        return timeA - timeB;
      });
    });

    return sortedGrouped;
  }, [events]);

  // 오늘 일정만 필터링 (일별 보기일 때)
  const todayEvents = useMemo(() => {
    if (viewMode !== 'day') return null;
    if (!events || events.length === 0) return [];
    
    const today = getKoreaToday();
    
    return events.filter(event => isEventOnDate(event, today))
      .sort((a, b) => {
        const timeA = a.start?.dateTime || a.start?.date || '';
        const timeB = b.start?.dateTime || b.start?.date || '';
        return timeA.localeCompare(timeB);
      });
  }, [events, viewMode]);

  // 주별 그리드 데이터 생성
  const weekGridData = useMemo(() => {
    if (viewMode !== 'week' || !events || events.length === 0) return null;

    const today = getKoreaToday();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayEvents = events.filter(event => isEventOnDate(event, date));
      
      days.push({
        date,
        dateKey,
        dayName: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.getTime() === today.getTime(),
        events: dayEvents.sort((a, b) => {
          const timeA = a.start?.dateTime || a.start?.date || '';
          const timeB = b.start?.dateTime || b.start?.date || '';
          return timeA.localeCompare(timeB);
        })
      });
    }
    
    return days;
  }, [events, viewMode]);

  // 월별 그리드 데이터 생성
  const monthGridData = useMemo(() => {
    if (viewMode !== 'month' || !events || events.length === 0) return null;

    const today = getKoreaToday();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstDay = new Date(monthStart);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());
    
    const lastDay = new Date(monthEnd);
    lastDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const weeks = [];
    let currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate);
        const dateKey = date.toISOString().split('T')[0];
        const isCurrentMonth = date.getMonth() === today.getMonth();
        const dayEvents = events.filter(event => isEventOnDate(event, date));
        
        week.push({
          date,
          dateKey,
          dayNumber: date.getDate(),
          isToday: date.getTime() === today.getTime(),
          isCurrentMonth,
          events: dayEvents.sort((a, b) => {
            const timeA = a.start?.dateTime || a.start?.date || '';
            const timeB = b.start?.dateTime || b.start?.date || '';
            return timeA.localeCompare(timeB);
          })
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }
    
    return weeks;
  }, [events, viewMode]);

  // 선택된 날짜의 이벤트 가져오기
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate || !events) return [];
    return events.filter(event => isEventOnDate(event, selectedDate))
      .sort((a, b) => {
        const timeA = a.start?.dateTime || a.start?.date || '';
        const timeB = b.start?.dateTime || b.start?.date || '';
        return timeA.localeCompare(timeB);
      });
  }, [selectedDate, events]);

  // 더보기 클릭 핸들러
  const handleShowMore = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // 일별 보기용 그리드 컬럼 수 계산 (정사각형 그리드)
  const calculateGridColumns = (count) => {
    if (count === 0) return 1;
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    if (count <= 16) return 4;
    if (count <= 25) return 5;
    return 6; // 최대 6열
  };

  // 초기화 중이면 로딩 표시
  if (isInitializing) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center" bg="gray.800" p={4}>
        <VStack gap={4}>
          <Text color="white" fontSize="xl">
            📅 Google API 초기화 중...
          </Text>
        </VStack>
      </Box>
    );
  }

  // 에러가 있으면 표시
  if (initError) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center" bg="gray.800" p={4}>
        <VStack gap={4}>
          <Text color="red.300" fontSize="xl" fontWeight="bold">
            ⚠️ 초기화 오류
          </Text>
          <Text color="gray.400" fontSize="md" textAlign="center">
            {initError}
          </Text>
          <Button
            onClick={async () => {
              setInitError(null);
              setIsInitializing(true);
              try {
                await initializeGoogleAPI();
              } catch (error) {
                setInitError(error.message || 'Google API 초기화에 실패했습니다.');
              } finally {
                setIsInitializing(false);
              }
            }}
            bg="blue.500"
            color="white"
            _hover={{ bg: 'blue.600' }}
          >
            🔄 다시 시도
          </Button>
        </VStack>
      </Box>
    );
  }

  if (!accessToken) {
    const nextLoginTime = getNextLoginTime();
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center" bg="gray.800" p={4}>
        <VStack gap={4}>
          <Text color="white" fontSize="2xl" fontWeight="bold">
            📅 구글 캘린더 연동
          </Text>
          <Text color="gray.400" fontSize="md" textAlign="center">
            구글 캘린더를 연동하여 일정을 확인할 수 있습니다.
          </Text>
          <Text color="gray.500" fontSize="sm" textAlign="center">
            다음 자동 로그인 시도: {nextLoginTime.toLocaleString('ko-KR')}
          </Text>
          <Text color="gray.500" fontSize="xs" textAlign="center">
            (매일 오전 {LOGIN_HOUR}시 {LOGIN_MINUTE}분에 자동 로그인 시도)
          </Text>
          <Button
            onClick={() => {
              recordLoginAttempt(); // 수동 로그인도 기록
              login();
            }}
            bg="blue.500"
            color="white"
            size="lg"
            _hover={{ bg: 'blue.600' }}
          >
            🔐 구글 로그인
          </Button>
        </VStack>
      </Box>
    );
  }

  if (isFetching) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center" bg="gray.800">
        <Text color="white" fontSize="xl">📅 캘린더 일정 로딩중...</Text>
      </Box>
    );
  }

  // 뷰 모드 전환 버튼
  const ViewModeButtons = () => (
    <HStack gap={2}>
      <Button
        onClick={() => {
          handleViewModeChange('day');
          setIsVisible(true); // 버튼 클릭 시 즉시 표시
        }}
        bg={viewMode === 'day' ? 'blue.500' : 'gray.600'}
        color="white"
        size="sm"
        _hover={{ bg: viewMode === 'day' ? 'blue.600' : 'gray.500' }}
      >
        일별
      </Button>
      <Button
        onClick={() => {
          handleViewModeChange('week');
          setIsVisible(true);
        }}
        bg={viewMode === 'week' ? 'blue.500' : 'gray.600'}
        color="white"
        size="sm"
        _hover={{ bg: viewMode === 'week' ? 'blue.600' : 'gray.500' }}
      >
        주별
      </Button>
      <Button
        onClick={() => {
          handleViewModeChange('month');
          setIsVisible(true);
        }}
        bg={viewMode === 'month' ? 'blue.500' : 'gray.600'}
        color="white"
        size="sm"
        _hover={{ bg: viewMode === 'month' ? 'blue.600' : 'gray.500' }}
      >
        월별
      </Button>
    </HStack>
  );

  // 새로고침 및 로그아웃 버튼
  const ActionButtons = () => (
    <HStack gap={2}>
      <ViewModeButtons />
      <Button
        onClick={() => refetch()}
        size="sm"
        bg="gray.600"
        color="white"
        _hover={{ bg: 'gray.500' }}
      >
        새로고침
      </Button>
      <Button
        onClick={handleLogout}
        size="sm"
        bg="red.600"
        color="white"
        _hover={{ bg: 'red.500' }}
      >
        로그아웃
      </Button>
    </HStack>
  );

  // 일별 보기 - 정사각형 그리드 (스크롤 없이)
  const renderDayView = () => {
    if (!todayEvents || todayEvents.length === 0) {
      return (
        <Box 
          h="100%" 
          display="flex" 
          flexDirection="column" 
          bg="gray.800" 
          p={4}
          opacity={isVisible ? 1 : 0}
          transition="opacity 0.5s"
        >
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Text color="white" fontSize="2xl" fontWeight="bold">
              📅 오늘 일정
            </Text>
            <ActionButtons />
          </Flex>
          <Box flex="1" display="flex" alignItems="center" justifyContent="center">
            <VStack gap={4}>
              {sessionExpired ? (
                <>
                  <Text color="red.300" fontSize="xl" fontWeight="bold">⚠️ 세션 만료</Text>
                  <Text color="gray.400">Google 캘린더 세션이 만료되었습니다.</Text>
                  <Text color="gray.500" fontSize="sm">다음 자동 로그인: {getNextLoginTime().toLocaleString('ko-KR')}</Text>
                  <Text color="gray.500" fontSize="xs" mt={2}>
                    (매일 오전 {LOGIN_HOUR}시 {LOGIN_MINUTE}분에 자동 로그인 시도)
                  </Text>
                </>
              ) : (
                <>
                  <Text color="white" fontSize="xl">📅 오늘 일정이 없습니다</Text>
                  <Text color="gray.400">오늘 예정된 일정이 없습니다.</Text>
                </>
              )}
            </VStack>
          </Box>
          {/* Footer */}
          <Box mt={4} textAlign="center" pt={2} borderTop="1px solid" borderColor="gray.700">
            <Text color="gray.500" fontSize="sm">
              🔄 12시간마다 자동 갱신, 즉시 갱신은 새로고침을 눌러주세요.
            </Text>
          </Box>
        </Box>
      );
    }

    const columns = calculateGridColumns(todayEvents.length);
    const rows = Math.ceil(todayEvents.length / columns);
    
    // 고정 크기로 설정 (더 작게)
    const itemHeight = `calc((100% - ${(rows - 1) * 12}px) / ${rows})`;
    const itemWidth = `calc((100% - ${(columns - 1) * 12}px) / ${columns})`;

    return (
      <Box 
        h="100%" 
        display="flex" 
        flexDirection="column" 
        bg="gray.800" 
        p={4}
        opacity={isVisible ? 1 : 0}
        transition="opacity 0.5s"
      >
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <VStack align="start" gap={1}>
            <Text color="white" fontSize="25px" fontWeight="bold">
              📅 오늘 일정
            </Text>
            <Text color="gray.400" fontSize="20px">
              총 {todayEvents.length}개 일정
            </Text>
          </VStack>
          <ActionButtons />
        </Flex>

        <Box flex="1" display="flex" alignItems="stretch" overflow="hidden">
          <Grid 
            templateColumns={`repeat(${columns}, 1fr)`} 
            gap={3}
            w="100%"
            h="100%"
            autoRows="1fr"
          >
            {todayEvents.map((event, index) => {
              const startDate = event.start?.dateTime || event.start?.date;
              const endDate = event.end?.dateTime || event.end?.date;
              const isAllDay = !event.start?.dateTime;

              return (
                <Box
                  key={event.id || index}
                  bg="gray.700"
                  borderRadius="md"
                  p={5}
                  borderLeft="4px solid"
                  borderLeftColor={`${getEventColor(event)}.400`}
                  _hover={{ bg: 'gray.650', transform: 'scale(1.02)' }}
                  transition="all 0.2s"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  minH="0"
                  overflow="hidden"
                >
                  <Box flex="1" minH="0">
                    <Text color="white" fontSize="30px" fontWeight="bold" mb={2} noOfLines={2}>
                      {event.summary || '(제목 없음)'}
                    </Text>
                    <VStack align="start" gap={1}>
                      {!isAllDay && (
                        <Text color="gray.300" fontSize="30px">
                          ⏰ {formatTime(startDate)} - {formatTime(endDate)}
                        </Text>
                      )}
                      {isAllDay && (
                        <Text color="gray.300" fontSize="30px">
                          ⏰ 종일
                        </Text>
                      )}
                      {event.location && (
                        <Text color="gray.400" fontSize="30px" noOfLines={1}>
                          📍 {event.location}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                  {event.description && (
                    <Text color="gray.400" fontSize="30px" noOfLines={2} mt={2}>
                      {event.description}
                    </Text>
                  )}
                </Box>
              );
            })}
          </Grid>
        </Box>
        
        {/* Footer */}
        <Box mt={4} textAlign="center" pt={2} borderTop="1px solid" borderColor="gray.700">
          <Text color="gray.500" fontSize="sm">
            🔄 12시간마다 자동 갱신, 즉시 갱신은 새로고침을 눌러주세요.
          </Text>
        </Box>
      </Box>
    );
  };

  // 주별 보기용 날짜 박스 컴포넌트
  const WeekDayBox = ({ day, onShowMore, getEventColor }) => {
    const [needsMoreButton, setNeedsMoreButton] = useState(false);
    const containerRef = useRef(null);
    
    useEffect(() => {
      if (containerRef.current) {
        const checkOverflow = () => {
          const container = containerRef.current;
          if (container) {
            const hasOverflow = container.scrollHeight > container.clientHeight;
            setNeedsMoreButton(hasOverflow && day.events.length > 0);
          }
        };
        checkOverflow();
        const timer = setTimeout(checkOverflow, 100);
        return () => clearTimeout(timer);
      }
    }, [day.events.length]);
    
    return (
      <Box
        bg={day.isToday ? 'blue.900' : 'gray.700'}
        borderRadius="md"
        p={3}
        border={day.isToday ? '2px solid' : '1px solid'}
        borderColor={day.isToday ? 'blue.400' : 'gray.600'}
        h="100%"
        display="flex"
        flexDirection="column"
      >
        <Text
          color={day.isToday ? 'blue.300' : 'gray.300'}
          fontSize="25px"
          fontWeight="bold"
          mb={1}
        >
          {day.dayName}
        </Text>
        <Text
          color={day.isToday ? 'white' : 'gray.200'}
          fontSize="xl"
          fontWeight="bold"
          mb={2}
        >
          {day.dayNumber}
        </Text>
        <VStack 
          gap={1} 
          align="stretch" 
          flex="1" 
          overflow="hidden"
          minH="0"
        >
          <Box 
            ref={containerRef}
            flex="1" 
            overflow="auto"
            w="100%"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#4A5568',
                borderRadius: '2px',
              },
            }}
          >
            {day.events.map((event, idx) => (
              <Box
                key={event.id || idx}
                bg={`${getEventColor(event)}.600`}
                borderRadius="sm"
                p={1.5}
                fontSize="20px"
                color="white"
                noOfLines={1}
                title={event.summary}
                cursor="pointer"
                _hover={{ opacity: 0.8 }}
                mb={idx < day.events.length - 1 ? 1 : 0}
              >
                {event.summary || '(제목 없음)'}
              </Box>
            ))}
          </Box>
          {needsMoreButton && (
            <Button
              size="xs"
              bg="gray.600"
              color="white"
              _hover={{ bg: 'gray.500' }}
              onClick={() => onShowMore(day.date)}
              flexShrink={0}
            >
              +{day.events.length}개 더
            </Button>
          )}
        </VStack>
      </Box>
    );
  };

  // 월별 보기용 날짜 박스 컴포넌트
  const MonthDayBox = ({ day, onShowMore, getEventColor }) => {
    const [needsMoreButton, setNeedsMoreButton] = useState(false);
    const containerRef = useRef(null);
    
    useEffect(() => {
      if (containerRef.current) {
        const checkOverflow = () => {
          const container = containerRef.current;
          if (container) {
            const hasOverflow = container.scrollHeight > container.clientHeight;
            setNeedsMoreButton(hasOverflow && day.events.length > 0);
          }
        };
        checkOverflow();
        const timer = setTimeout(checkOverflow, 100);
        return () => clearTimeout(timer);
      }
    }, [day.events.length]);
    
    return (
      <Box
        bg={day.isToday ? 'blue.900' : day.isCurrentMonth ? 'gray.700' : 'gray.800'}
        borderRadius="md"
        p={2}
        h="100%"
        border={day.isToday ? '2px solid' : '1px solid'}
        borderColor={day.isToday ? 'blue.400' : 'gray.600'}
        opacity={day.isCurrentMonth ? 1 : 0.5}
        display="flex"
        flexDirection="column"
        minH="0"
      >
        <Text
          color={day.isToday ? 'blue.300' : day.isCurrentMonth ? 'gray.300' : 'gray.500'}
          fontSize="sm"
          fontWeight="bold"
          mb={1}
          flexShrink={0}
        >
          {day.dayNumber}
        </Text>
        <VStack 
          gap={1} 
          align="stretch" 
          flex="1" 
          overflow="hidden"
          minH="0"
        >
          <Box 
            ref={containerRef}
            flex="1" 
            overflow="auto"
            w="100%"
            minH="0"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#4A5568',
                borderRadius: '2px',
              },
            }}
          >
            {day.events.map((event, idx) => (
              <Box
                key={event.id || idx}
                bg={`${getEventColor(event)}.600`}
                borderRadius="sm"
                p={1}
                fontSize="14px"
                fontWeight={'bold'}
                color="white"
                noOfLines={1}
                title={event.summary}
                cursor="pointer"
                _hover={{ opacity: 0.8 }}
                mb={idx < day.events.length - 1 ? 1 : 0}
              >
                {event.summary || '(제목 없음)'}
              </Box>
            ))}
          </Box>
          {needsMoreButton && (
            <Button
              size="xs"
              bg="gray.600"
              color="white"
              _hover={{ bg: 'gray.500' }}
              onClick={() => onShowMore(day.date)}
              fontSize="xs"
              h="20px"
              px={1}
              flexShrink={0}
            >
              +{day.events.length}개 더
            </Button>
          )}
        </VStack>
      </Box>
    );
  };

  // 주별 보기 - 그리드 형태
  const renderWeekView = () => {
    if (!weekGridData) {
      return (
        <Box 
          h="100%" 
          display="flex" 
          flexDirection="column" 
          bg="gray.800" 
          p={4}
          opacity={isVisible ? 1 : 0}
          transition="opacity 0.5s"
        >
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Text color="white" fontSize="2xl" fontWeight="bold">
              📅 주별 일정
            </Text>
            <ActionButtons />
          </Flex>
          <Box flex="1" display="flex" alignItems="center" justifyContent="center">
            {sessionExpired ? (
              <VStack gap={2}>
                <Text color="red.300" fontSize="lg" fontWeight="bold">⚠️ 세션 만료</Text>
                <Text color="gray.400">Google 캘린더 세션이 만료되었습니다.</Text>
                <Text color="gray.500" fontSize="sm">다음 자동 로그인: {getNextLoginTime().toLocaleString('ko-KR')}</Text>
                <Text color="gray.500" fontSize="xs" mt={2}>
                  (매일 오전 {LOGIN_HOUR}시 {LOGIN_MINUTE}분에 자동 로그인 시도)
                </Text>
              </VStack>
            ) : (
              <Text color="gray.400">일정이 없습니다.</Text>
            )}
          </Box>
          {/* Footer */}
          <Box mt={4} textAlign="center" pt={2} borderTop="1px solid" borderColor="gray.700">
            <Text color="gray.500" fontSize="sm">
              🔄 12시간마다 자동 갱신, 즉시 갱신은 새로고침을 눌러주세요.
            </Text>
          </Box>
        </Box>
      );
    }

    const today = getKoreaToday();
    const monthYear = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    
    return (
      <Box 
        h="100%" 
        display="flex" 
        flexDirection="column" 
        bg="gray.800" 
        p={4}
        opacity={isVisible ? 1 : 0}
        transition="opacity 0.5s"
      >
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <VStack align="start" gap={1}>
            <Text color="white" fontSize="2xl" fontWeight="bold">
              📅 주별 일정
            </Text>
            <Text color="gray.400" fontSize="md">
              {monthYear}
            </Text>
          </VStack>
          <ActionButtons />
        </Flex>

        <Box flex="1" overflow="hidden" display="flex" alignItems="stretch">
          <Grid 
            templateColumns="repeat(7, 1fr)" 
            gap={2}
            w="100%"
            h="100%"
          >
            {weekGridData.map((day) => (
              <WeekDayBox 
                key={day.dateKey}
                day={day}
                onShowMore={handleShowMore}
                getEventColor={getEventColor}
              />
            ))}
          </Grid>
        </Box>

        
        {/* Footer */}
        <Box mt={4} textAlign="center" pt={2} borderTop="1px solid" borderColor="gray.700">
          <Text color="gray.500" fontSize="sm">
            🔄 5분마다 자동 갱신
          </Text>
        </Box>
      </Box>
    );
  };

  // 월별 보기 - 그리드 형태
  const renderMonthView = () => {
    if (!monthGridData) {
      return (
        <Box 
          h="100%" 
          display="flex" 
          flexDirection="column" 
          bg="gray.800" 
          p={4}
          opacity={isVisible ? 1 : 0}
          transition="opacity 0.5s"
        >
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Text color="white" fontSize="2xl" fontWeight="bold">
              📅 월별 일정
            </Text>
            <ActionButtons />
          </Flex>
          <Box flex="1" display="flex" alignItems="center" justifyContent="center">
            {sessionExpired ? (
              <VStack gap={2}>
                <Text color="red.300" fontSize="lg" fontWeight="bold">⚠️ 세션 만료</Text>
                <Text color="gray.400">Google 캘린더 세션이 만료되었습니다.</Text>
                <Text color="gray.500" fontSize="sm">다음 자동 로그인: {getNextLoginTime().toLocaleString('ko-KR')}</Text>
                <Text color="gray.500" fontSize="xs" mt={2}>
                  (매일 오전 {LOGIN_HOUR}시 {LOGIN_MINUTE}분에 자동 로그인 시도)
                </Text>
              </VStack>
            ) : (
              <Text color="gray.400">일정이 없습니다.</Text>
            )}
          </Box>
          {/* Footer */}
          <Box mt={4} textAlign="center" pt={2} borderTop="1px solid" borderColor="gray.700">
            <Text color="gray.500" fontSize="sm">
              🔄 5분마다 자동 갱신
            </Text>
          </Box>
        </Box>
      );
    }

    const today = getKoreaToday();
    const monthYear = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    return (
      <Box 
        h="100%" 
        display="flex" 
        flexDirection="column" 
        bg="gray.800" 
        p={4}
        opacity={isVisible ? 1 : 0}
        transition="opacity 0.5s"
      >
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <VStack align="start" gap={1}>
            <Text color="white" fontSize="2xl" fontWeight="bold">
              📅 월별 일정
            </Text>
            <Text color="gray.400" fontSize="lg">
              {monthYear}
            </Text>
          </VStack>
          <ActionButtons />
        </Flex>

        <Box flex="1" overflow="hidden" display="flex" flexDirection="column">
          {/* 요일 헤더 */}
          <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2} flexShrink={0}>
            {dayNames.map((dayName) => (
              <Box key={dayName} textAlign="center" p={2}>
                <Text color="gray.400" fontSize="sm" fontWeight="bold">
                  {dayName}
                </Text>
              </Box>
            ))}
          </Grid>

          {/* 주별 그리드 */}
          <Box flex="1" overflow="hidden" display="flex" flexDirection="column" minH="0">
            <VStack gap={1} align="stretch" flex="1" h="100%" minH="0">
              {monthGridData.map((week, weekIdx) => (
                <Grid 
                  key={weekIdx} 
                  templateColumns="repeat(7, 1fr)" 
                  gap={1}
                  flex="1"
                  minH="0"
                >
                  {week.map((day) => (
                    <MonthDayBox
                      key={day.dateKey}
                      day={day}
                      onShowMore={handleShowMore}
                      getEventColor={getEventColor}
                    />
                  ))}
                </Grid>
              ))}
            </VStack>
          </Box>
        </Box>
        
        {/* Footer */}
        <Box mt={4} textAlign="center" pt={2} borderTop="1px solid" borderColor="gray.700">
          <Text color="gray.500" fontSize="sm">
            🔄 5분마다 자동 갱신
          </Text>
        </Box>
      </Box>
    );
  };

  // 메인 렌더링
  return (
    <>
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {/* 더보기 모달 - 모든 뷰에서 렌더링 */}
            <DialogRoot open={isModalOpen} onOpenChange={(e) => !e.open && setIsModalOpen(false)} size="md">
        <DialogBackdrop bg="blackAlpha.800" onClick={() => setIsModalOpen(false)} />
        <DialogPositioner placement="center" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <DialogContent 
            bg="gray.800" 
            maxW="450px" 
            w="90vw"
            mt="10vh"
          >
            <DialogHeader borderBottom="1px solid" borderColor="gray.700" pb={3} position="relative" pr={10}>
              <DialogTitle color="white" fontSize="lg">
                {selectedDate && formatDate(selectedDate.toISOString().split('T')[0])}
              </DialogTitle>
              <CloseButton
                onClick={() => setIsModalOpen(false)}
                color="gray.400"
                _hover={{ color: 'white', bg: 'gray.700' }}
                position="absolute"
                right={2}
                top={2}
              />
            </DialogHeader>
            <DialogBody p={3} maxH="60vh" overflow="auto">
              <VStack gap={2} align="stretch">
                {selectedDateEvents.length === 0 ? (
                  <Text color="gray.400" textAlign="center" py={6}>
                    이 날짜에는 일정이 없습니다.
                  </Text>
                ) : (
                  selectedDateEvents.map((event, index) => {
                    const startDate = event.start?.dateTime || event.start?.date;
                    const endDate = event.end?.dateTime || event.end?.date;
                    const isAllDay = !event.start?.dateTime;

                    return (
                      <Box
                        key={event.id || index}
                        bg="gray.700"
                        borderRadius="md"
                        p={3}
                        borderLeft="3px solid"
                        borderLeftColor={`${getEventColor(event)}.400`}
                      >
                        <Text color="white" fontSize="md" fontWeight="bold" mb={1.5}>
                          {event.summary || '(제목 없음)'}
                        </Text>
                        <VStack align="start" gap={0.5}>
                          {!isAllDay && (
                            <Text color="gray.300" fontSize="sm">
                              ⏰ {formatTime(startDate)} - {formatTime(endDate)}
                            </Text>
                          )}
                          {isAllDay && (
                            <Text color="gray.300" fontSize="sm">
                              ⏰ 종일
                            </Text>
                          )}
                          {event.location && (
                            <Text color="gray.400" fontSize="xs">
                              📍 {event.location}
                            </Text>
                          )}
                          {event.description && (
                            <Text color="gray.400" fontSize="xs" whiteSpace="pre-wrap" noOfLines={3}>
                              {event.description}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    );
                  })
                )}
              </VStack>
            </DialogBody>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </>
  );
};
export default GoogleCalendar;
