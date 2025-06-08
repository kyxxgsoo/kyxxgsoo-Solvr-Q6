# 수면 기록 앱

수면 시간과 특이사항을 기록하고 관리할 수 있는 웹 애플리케이션입니다.

## 기능

### 기본 기능
- 사용자는 매일 수면시간 및 특이사항을 기록할 수 있습니다.
- 사용자는 기록한 내역을 리스트로 확인할 수 있습니다.
- 사용자는 기록한 내역을 업데이트하거나, 삭제할 수 있습니다.

### 추가 기능
- 수면 시작 시간은 종료 시간보다 이전이어야 합니다.
- 수면 기록은 최신순으로 정렬되어 표시됩니다.
- 날짜와 시간은 한국어 형식으로 표시됩니다.
- 지난 7일간의 수면 통계 (평균 수면 시간, 수면 기록 횟수)를 차트로 시각화합니다.
- 수면 시간 변동성, 주별 총 수면 시간 추이, 수면 시간대별 분포 차트를 추가하여 다양한 수면 인사이트를 제공합니다.
- 수면 통계 및 수면 기록 목록 섹션을 접거나 펼 수 있는 기능을 제공합니다.
- 수면 기록 생성/수정 시 현재 시간보다 미래의 시간을 입력할 수 없도록 유효성 검사를 추가했습니다.
- 수면 기록 생성/수정 시 기존 기록과 시간이 중복될 수 없도록 유효성 검사를 추가했습니다.
- **AI 조언 기능:** 사용자의 수면 기록 데이터를 기반으로 AI(LLM)가 수면 상태를 진단하고 개인화된 조언을 제공합니다.

## 기술 스택

### Frontend
- React
- TypeScript
- Tailwind CSS
- date-fns (날짜 포맷팅)
- react-chartjs-2, chart.js (차트 시각화)
- chartjs-adapter-date-fns (Chart.js date-fns 어댑터)

### Backend
- Node.js
- Fastify
- TypeScript
- Prisma
- SQLite
- Zod (데이터 유효성 검증)
- **@google/genai (Google LLM API 연동)**
- **dotenv (환경 변수 관리)**

## 시작하기

### 환경 설정
1. `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:
```env
DATABASE_URL="file:./data/database.sqlite"
# Google AI Studio에서 발급받은 API 키를 설정합니다.
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 설치 및 실행
1. 의존성 설치:
```bash
pnpm install
```

2. 데이터베이스 마이그레이션:
```bash
pnpm migrate
```

3. 개발 서버 실행:
```bash
pnpm dev
```

- 클라이언트: http://localhost:3000
- 서버: http://localhost:8000

## API 엔드포인트

### 수면 기록
- `GET /api/sleep`: 모든 수면 기록 조회
- `POST /api/sleep`: 새로운 수면 기록 생성
- `PUT /api/sleep/:id`: 기존 수면 기록 업데이트
- `DELETE /api/sleep/:id`: 수면 기록 삭제
- `GET /api/sleep/stats`: 지난 7일간의 수면 통계 조회
- `GET /api/sleep/stats/weekly-duration`: 주별 총 수면 시간 추이 조회
- `GET /api/sleep/stats/hour-distribution`: 수면 시간대별 분포 조회
- **`POST /api/sleep/advice`: 수면 기록 데이터를 기반으로 AI 조언 생성**

### 요청/응답 형식
```typescript
// POST /api/sleep 또는 PUT /api/sleep/:id
{
  "startTime": "2024-03-20T23:00:00Z",
  "endTime": "2024-03-21T07:00:00Z",
  "note": "수면의 질이 좋았음"
}

// POST /api/sleep/advice 요청 바디 예시
{
  "sleeps": [
    // Sleep record objects
  ],
  "sleepStats": [
    // Daily sleep stats objects
  ],
  "weeklySleepStats": [
    // Weekly sleep stats objects
  ],
  "hourDistributionStats": [
    // Hourly distribution stats objects
  ]
}
```

## 유효성 검증
- 수면 시작 시간은 종료 시간보다 이전이어야 합니다.
- 수면 시작/종료 시간은 현재 시간보다 이후일 수 없습니다.
- 해당 시간대에 이미 다른 수면 기록이 존재하면 안 됩니다.
- 모든 시간은 ISO 8601 형식의 문자열이어야 합니다.
- 특이사항(note)은 선택사항입니다.

## Changelog

### Task 3: Mission Complete!
- **AI 조언 기능 추가:**
  - Google LLM API (`@google/genai`와 `gemma-3-1b-it` 모델)를 활용하여 사용자의 수면 기록 데이터를 기반으로 수면 상태를 진단하고 개인화된 AI 조언을 제공합니다.
  - 백엔드 (`server/src/routes/sleep.ts`)에 `POST /api/sleep/advice` 엔드포인트를 추가하여 클라이언트로부터 수면 데이터를 받아 LLM을 호출하고 조언을 생성합니다.
  - 클라이언트 (`client/src/App.tsx`)에 AI 조언을 요청하고 표시하는 UI를 추가했습니다.
- **서버 환경 및 코드 개선:**
  - 서버 프로젝트를 ES 모듈 (`server/package.json`의 `"type": "module"`)로 전환함에 따라 발생한 TypeScript 임포트 경로 오류 (`.js` 확장자 누락)를 수정했습니다.
  - `server/src/types/index.ts`에서 `NewUser` 임포트 오류 및 기타 모듈 참조 오류를 해결했습니다.
  - `server/src/lib/prisma.ts`의 임포트 경로를 `@lib/prisma`에서 상대 경로로 수정하여 모듈을 찾을 수 없는 문제를 해결했습니다.
- **클라이언트 코드 정리:**
  - `client/src/App.tsx`에서 사용되지 않는 `parseISO`, `getWeek` 임포트를 제거하여 린터 경고를 해결하고 코드를 정리했습니다.

### Task 2: Mission Complete!
- **통계 정보 화면 개선:**
  - 지난 7일간의 일일 평균 수면 시간 및 일일 수면 기록 횟수를 보여주는 차트를 추가했습니다.
  - 수면 시작 및 종료 시간의 일별 변동성을 보여주는 `수면 시간 변동성 차트`를 추가했습니다.
  - 주별 총 수면 시간 추이를 보여주는 `주별 총 수면 시간 추이 차트`를 추가했습니다. 이 차트의 가로축 레이블은 '월 주차' 형식으로 표시되며, 월을 넘어가는 주는 '월 주차 ~ 다음 월 주차' 형식으로 표시됩니다.
  - 시간대별 수면 시작 및 종료 횟수를 보여주는 `수면 시간대별 분포 차트`를 추가했습니다.
  - 차트의 가독성을 높이기 위해 차트 배치를 `grid-cols-1`로 변경하고, 각 차트의 세로 길이를 늘렸습니다 (`min-h-80`).
  - 수면 통계 및 수면 기록 목록 섹션을 접거나 펼 수 있는 토글 기능을 추가하여 UI 편의성을 개선했습니다.

- **백엔드 기능 확장:**
  - `server/src/routes/sleep.ts`에 `/api/sleep/stats/weekly-duration` 및 `/api/sleep/stats/hour-distribution` 엔드포인트를 추가하여 새로운 통계 데이터를 제공합니다.
  - `server/src/routes/sleep.ts`의 `POST /api/sleep` 및 `PUT /api/sleep/:id` 엔드포인트에 `현재 시간보다 미래의 시간 입력 방지` 및 `수면 시간 중복 방지` 유효성 검사 로직을 추가했습니다.
  - `server/prisma/seed.ts`를 수정하여 6월과 7월이 겹치는 주의 더미 데이터를 포함한 다양한 수면 기록 데이터를 추가했습니다.

- **기술 스택 및 환경:**
  - `server/prisma/schema.prisma`의 데이터베이스 공급자를 PostgreSQL에서 SQLite로 변경했습니다.
  - 클라이언트(`client`)에 `react-chartjs-2`, `chart.js`, `chartjs-adapter-date-fns` 의존성을 추가했습니다.
  - 서버(`server`)에 `date-fns` 의존성을 추가했습니다.

- **오류 처리 개선:**
  - 클라이언트(`client/src/App.tsx`)에서 `datetime-local` 입력 값을 Date 객체로 변환하고 ISO 형식으로 포맷하는 방식을 개선했습니다. ( `formatISO(new Date())` 사용).
  - 서버(`server/src/routes/sleep.ts`)에서 Zod 유효성 검사 실패 시 `z.ZodError`의 `issues`를 분석하여 더 상세한 오류 메시지를 제공하도록 수정했습니다.
