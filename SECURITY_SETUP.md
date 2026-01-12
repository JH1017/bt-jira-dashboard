# 🔒 보안 설정 가이드

## 환경변수 설정

이 프로젝트는 민감한 정보(JIRA 자격증명)를 환경변수로 관리합니다.

### 1. 개발 환경 설정

`.env.development` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# JIRA API 설정
REACT_APP_JIRA_BASE_URL=/jira
REACT_APP_JIRA_USERNAME=your_jira_username
REACT_APP_JIRA_PASSWORD=your_jira_password

# 데이터 경로 설정
REACT_APP_DATA_PATH=/data
```

### 2. 프로덕션 환경 설정

`.env.production` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# JIRA API 설정
REACT_APP_JIRA_BASE_URL=http://qa.bridgetec.co.kr/jira
REACT_APP_JIRA_USERNAME=your_jira_username
REACT_APP_JIRA_PASSWORD=your_jira_password

# 데이터 경로 설정
REACT_APP_DATA_PATH=/dev6/data
```

### 3. 환경변수 파일 생성 (빠른 설정)

```bash
# .env.example을 복사하여 시작
cp .env.example .env.development
cp .env.example .env.production

# 에디터로 열어서 실제 값 입력
nano .env.development
nano .env.production
```

## ⚠️ 중요 보안 사항

### ❌ 절대 하지 말아야 할 것

1. **환경변수 파일을 Git에 커밋하지 마세요**
   - `.env.development`
   - `.env.production`
   - `.env.local`

2. **자격증명을 소스코드에 하드코딩하지 마세요**

3. **공개 저장소에 환경변수를 업로드하지 마세요**

### ✅ 해야 할 것

1. **환경변수 파일을 .gitignore에 추가** (이미 완료)
2. **팀원에게 별도로 자격증명 전달** (Slack DM, 비밀번호 관리 도구 등)
3. **프로덕션 서버에서는 환경변수를 서버 설정으로 관리**

## 환경변수 확인

앱 시작 시 환경변수가 제대로 로드되었는지 확인:

```javascript
// 개발 중에만 사용 (프로덕션에서는 제거)
console.log('JIRA BASE URL:', process.env.REACT_APP_JIRA_BASE_URL);
console.log('JIRA USERNAME:', process.env.REACT_APP_JIRA_USERNAME ? '✅ 설정됨' : '❌ 미설정');
console.log('JIRA PASSWORD:', process.env.REACT_APP_JIRA_PASSWORD ? '✅ 설정됨' : '❌ 미설정');
```

## 배포 시 환경변수 설정

### Vercel
```bash
vercel env add REACT_APP_JIRA_USERNAME
vercel env add REACT_APP_JIRA_PASSWORD
```

### Netlify
```bash
netlify env:set REACT_APP_JIRA_USERNAME "your_username"
netlify env:set REACT_APP_JIRA_PASSWORD "your_password"
```

### 일반 서버
서버의 환경변수 설정 파일에 추가하거나, CI/CD 파이프라인에서 주입합니다.

## 문제 해결

### "Cannot read properties of undefined" 에러

환경변수가 로드되지 않았을 때 발생합니다.

**해결방법**:
1. `.env.development` 또는 `.env.production` 파일이 존재하는지 확인
2. 파일명이 정확한지 확인 (앞에 점(.)이 있어야 함)
3. 개발 서버 재시작: `npm start`

### JIRA API 연결 실패

**체크리스트**:
- [ ] 환경변수 파일 생성 완료
- [ ] JIRA 사용자명/비밀번호 정확히 입력
- [ ] 개발 서버 재시작
- [ ] 브라우저 콘솔에서 네트워크 탭 확인

---

**보안 관련 문의**: 팀 리더 또는 시스템 관리자에게 문의하세요.
