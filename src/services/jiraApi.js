import axios from 'axios';

// JIRA 서버 설정
const JIRA_CONFIG = {
  baseURL: '/jira',
  username: 'woos798',
  password: '4072',
};

// 기본 쿼리 설정
export const DEFAULT_QUERIES = {
  received: `project = SS AND (처리부서 = 개발6팀 OR assignee in membersOf(개발6팀) ) AND createdDate > 2025-11-01 ORDER BY createdDate ASC`,
  inProgress: `project = SS AND (처리부서 = 개발6팀 OR assignee in membersOf(개발6팀) ) AND status != Closed ORDER BY createdDate ASC`,
  delayed: `project = SS AND (처리부서 = 개발6팀 OR assignee in membersOf(개발6팀)) AND status != Closed AND due < now()`,
  total: `project = SS AND (처리부서 = 개발6팀 OR assignee in membersOf(개발6팀)) AND status != Closed`,
};

// Axios 인스턴스 생성
const jiraClient = axios.create({
  baseURL: JIRA_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(`${JIRA_CONFIG.username}:${JIRA_CONFIG.password}`),
  },
});

// 경과일 계산 함수
const calculateDaysFromCreated = (createdDate) => {
  if (!createdDate) return 0;
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 날짜 포맷 함수 (YYYY-MM-DD)
const formatDate = (dateString, emptyText = '-') => {
  if (!dateString) return emptyText;
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 지연 여부 및 지연일 계산
const calculateDelay = (dueDate) => {
  if (!dueDate) return { isDelayed: false, delayDays: 0 };
  const due = new Date(dueDate);
  const now = new Date();
  
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  if (now > due) {
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { isDelayed: true, delayDays: diffDays };
  }
  return { isDelayed: false, delayDays: 0 };
};

// SRM 진행단계 값 추출
const getSrmStatus = (customField) => {
  if (!customField) return '-';
  // 객체인 경우 value 속성 사용
  if (typeof customField === 'object' && customField.value) {
    return customField.value;
  }
  // 문자열인 경우 그대로 반환
  if (typeof customField === 'string') {
    return customField;
  }
  return '-';
};

// 1페이지 - 지연 건
export const getDelayedIssues = async () => {
  try {
    const response = await jiraClient.get('/rest/api/2/search', {
      params: {
        jql: `project = SS AND (처리부서 = 개발6팀 OR assignee in membersOf(개발6팀)) AND (status != Closed) AND due < now() ORDER BY createdDate ASC`,
        maxResults: 50,
        fields: 'summary,priority,assignee,status,issuetype,created,duedate,customfield_11517',
      },
    });

    const issues = response.data.issues.map((issue) => {
      const delay = calculateDelay(issue.fields.duedate);
      return {
        key: issue.key,
        summary: issue.fields.summary,
        priority: issue.fields.priority?.name || 'Major',
        assignee: issue.fields.assignee?.displayName || '미지정',
        status: issue.fields.status?.name || '상태없음',
        srmStatus: getSrmStatus(issue.fields.customfield_11517),
        type: issue.fields.issuetype?.name || 'Task',
        createdDate: formatDate(issue.fields.created),
        daysFromCreated: calculateDaysFromCreated(issue.fields.created),
        dueDate: formatDate(issue.fields.duedate, '미설정'),
        isDelayed: delay.isDelayed,
        delayDays: delay.delayDays,
      };
    });

    return issues;
  } catch (error) {
    console.error('JIRA 지연 이슈 에러:', error);
    throw error;
  }
};

// 2페이지 - 전체 건
export const getAllIssues = async () => {
  try {
    const response = await jiraClient.get('/rest/api/2/search', {
      params: {
        jql: `project = SS AND (처리부서 = 개발6팀 OR assignee in membersOf(개발6팀)) AND status != Closed ORDER BY createdDate ASC`,
        maxResults: 50,
        fields: 'summary,priority,assignee,status,issuetype,created,duedate,customfield_11517',
      },
    });

    const issues = response.data.issues.map((issue) => {
      const delay = calculateDelay(issue.fields.duedate);
      return {
        key: issue.key,
        summary: issue.fields.summary,
        priority: issue.fields.priority?.name || 'Major',
        assignee: issue.fields.assignee?.displayName || '미지정',
        status: issue.fields.status?.name || '상태없음',
        srmStatus: getSrmStatus(issue.fields.customfield_11517),
        type: issue.fields.issuetype?.name || 'Task',
        createdDate: formatDate(issue.fields.created),
        daysFromCreated: calculateDaysFromCreated(issue.fields.created),
        dueDate: formatDate(issue.fields.duedate, '미설정'),
        isDelayed: delay.isDelayed,
        delayDays: delay.delayDays,
      };
    });

    // 지연 이슈를 맨 위로 정렬
    issues.sort((a, b) => {
      if (a.isDelayed && !b.isDelayed) return -1;
      if (!a.isDelayed && b.isDelayed) return 1;
      return 0;
    });

    return issues;
  } catch (error) {
    console.error('JIRA 전체 이슈 에러:', error);
    throw error;
  }
};

// 통계 가져오기 (쿼리 파라미터 받음)
export const getIssueStats = async (queries = DEFAULT_QUERIES) => {
  try {
    const received = await jiraClient.get('/rest/api/2/search', {
      params: {
        jql: queries.received,
        maxResults: 0,
      },
    });

    const inProgress = await jiraClient.get('/rest/api/2/search', {
      params: {
        jql: queries.inProgress,
        maxResults: 0,
      },
    });

    const delayed = await jiraClient.get('/rest/api/2/search', {
      params: {
        jql: queries.delayed,
        maxResults: 0,
      },
    });

    const total = await jiraClient.get('/rest/api/2/search', {
      params: {
        jql: queries.total,
        maxResults: 0,
      },
    });

    return {
      received: received.data.total,
      inProgress: inProgress.data.total,
      delayed: delayed.data.total,
      total: total.data.total,
    };
  } catch (error) {
    console.error('JIRA 통계 에러:', error);
    throw error;
  }
};

export default jiraClient;
