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

## 기술 스택

### Frontend
- React
- TypeScript
- Tailwind CSS
- date-fns (날짜 포맷팅)

### Backend
- Node.js
- Fastify
- TypeScript
- Prisma
- PostgreSQL
- Zod (데이터 유효성 검증)

## 시작하기

### 환경 설정
1. `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sleep_tracker"
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

### 요청/응답 형식
```typescript
// POST /api/sleep 또는 PUT /api/sleep/:id
{
  "startTime": "2024-03-20T23:00:00Z",
  "endTime": "2024-03-21T07:00:00Z",
  "note": "수면의 질이 좋았음"
}
```

## 유효성 검증
- 수면 시작 시간은 종료 시간보다 이전이어야 합니다.
- 모든 시간은 ISO 8601 형식의 문자열이어야 합니다.
- 특이사항(note)은 선택사항입니다.
