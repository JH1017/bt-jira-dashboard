import { gapi } from 'gapi-script';

// Google Calendar API 클라이언트
let gapiInitialized = false;

// Google API 초기화
export const initializeGoogleAPI = async () => {
  try {
    const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!CLIENT_ID) {
      throw new Error('REACT_APP_GOOGLE_CLIENT_ID가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }

    // 이미 초기화되어 있으면 스킵
    if (gapiInitialized && gapi && gapi.client) {
      try {
        if (gapi.client.getToken()) {
          return;
        }
      } catch (e) {
        // getToken이 실패해도 계속 진행
      }
    }

    // gapi-script를 사용하여 초기화
    await new Promise((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: '',
            clientId: CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar.readonly'
          });
          gapiInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Google API 초기화 에러:', error);
    throw error;
  }
};

// 토큰 설정 (@react-oauth/google에서 받은 토큰 사용)
export const setAccessToken = (accessToken) => {
  if (gapi && gapi.client) {
    gapi.client.setToken({ access_token: accessToken });
  }
};

// 캘린더 이벤트 가져오기
export const getCalendarEvents = async (maxResults = 10) => {
  try {
    if (!gapi || !gapi.client || !gapi.client.calendar) {
      throw new Error('Google Calendar API가 사용 가능하지 않습니다.');
    }
    
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: maxResults,
      orderBy: 'startTime'
    });

    return response.result.items || [];
  } catch (error) {
    console.error('캘린더 이벤트 가져오기 실패:', error);
    throw error;
  }
};

// 특정 날짜 범위의 이벤트 가져오기
export const getCalendarEventsByDateRange = async (startDate, endDate, maxResults = 50) => {
  try {
    if (!gapi || !gapi.client || !gapi.client.calendar) {
      throw new Error('Google Calendar API가 사용 가능하지 않습니다.');
    }
    
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: maxResults,
      orderBy: 'startTime'
    });

    return response.result.items || [];
  } catch (error) {
    console.error('캘린더 이벤트 가져오기 실패:', error);
    throw error;
  }
};