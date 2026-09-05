# Prism AI 제품 명세

## 1. 제품 개요

**Prism AI**는 사용자의 비즈니스 질문을 실제 데이터 분석과 인터랙티브 Dashboard로 변환하는 AI Analytics Workspace다.

제품 문구:

> Ask your data. Build your dashboard.

첫 번째 Portfolio Domain은 합성 E-commerce Analytics다. 범용 BI를 만드는 것이 아니라, 비결정적인 LLM 출력과 결정론적인 데이터 계산, 제한된 React UI System을 안전하게 연결하는 Frontend Engineering을 보여주는 것이 목적이다.

## 2. 해결하려는 문제

기존 Dashboard에서는 사용자가 지표 위치, 기간, 비교 조건, Filter, Chart 종류를 직접 알아야 한다. Prism AI에서는 다음과 같은 질문으로 분석을 시작한다.

- 지난달 매출이 왜 감소했어?
- 이번 달 성과를 보여줘.
- 모바일만 자세히 분석해줘.
- 작년 같은 기간과 비교해줘.
- 가장 많이 하락한 상품은 뭐야?
- 광고비 대비 성과를 보여줘.
- 환불률이 높은 지역을 알려줘.

Application은 지원 범위 안에서 필요한 데이터를 결정하고, 실제 값을 계산한 뒤 질문에 적합한 Dashboard를 구성한다.

## 3. 대상 사용자

MVP 사용자는 E-commerce 운영자, Product Manager, Marketer, Team Lead다. 복잡한 BI Tool 사용법보다 비즈니스 질문에 집중하는 사람을 가정한다.

Portfolio 평가자에게는 다음 역량이 보여야 한다.

- Schema 기반 Dynamic UI
- 복잡한 비동기 상태 관리
- 후속 질문 Context 처리
- 데이터 시각화
- 결정론적 분석 로직
- 안전한 AI 연동
- 오류 복구
- 유지보수 가능한 React 구조

## 4. 핵심 사용자 경험

### 표시 언어

사용자 화면의 메뉴·상태·표·접근성 안내는 한국어를 사용한다. 제품명 Prism AI는
유지한다. 내부 지표·차원·Filter 값은 바꾸지 않고 표시 계층에서 한글화한다.
사용자가 직접 입력한 질문은 원문을 보존한다. 새 Composer 표시 문구는 한국어로
요청하고, 저장된 영어 제목을 번역할 수 없으면 지표 또는 위젯 기반 한글 제목으로 표시한다.

### 공통 탐색

Desktop·Mobile의 Prism AI 로고는 홈으로 이동한다. 주요 탐색에는 실제 화면이
있는 홈과 분석 기록만 표시하며, 현재 Dashboard를 홈으로 표시하지 않는다.
Library·Settings·알림·도움말·보기 전환 탭은 구현 전까지 노출하지 않는다.

`새 분석`은 홈의 질문 입력칸으로, `분석 기록 검색`은 기록의 실제 검색 입력칸으로
이동한다. 검색란은 저장 기록 Hydration 전에도 렌더링해 직접 링크의 대상을 유지한다.
본문 건너뛰기는 현재 화면의 포커스 가능한 `main`으로 이동한다.
기록에서 연 Dashboard에는 분석 기록으로 돌아가는 링크를 제공한다.

### 4.1 첫 질문

Home에는 큰 Prompt Input, 추천 질문 9개, 합성 데이터 기간, 최근 분석이 보인다.
추천 질문을 선택하면 입력칸으로 포커스를 이동한다. Enter는 제출, Shift+Enter는
줄바꿈이며 한글 등 IME 조합 중 Enter는 제출하지 않는다.
새 제출은 고유 Dashboard ID를 생성해 서로 다른 분석의 편집값이 섞이지 않게 한다.
동일 Dashboard 안의 후속 질문은 기존 Dashboard ID를 유지한다.

대표 질문:

```text
지난달 매출이 왜 감소했어?
```

### 4.2 생성된 분석

질문에 필요한 Widget만 구성한다. 매출 하락 분석에서는 다음 Widget을 사용할 수 있다.

- 현재 매출과 증감률
- 주문 수와 증감률
- 매출 추이
- Device별 변화
- Category별 변화
- 하락 기여 Segment 순위
- Finding 근거와 연결된 AI 요약

### 4.3 후속 질문

Dashboard 하단에 Prompt를 유지한다. 후속 질문은 처음부터 새로운 분석을 만드는 것이 아니라 현재 Context 일부를 변경한다.

```text
모바일만 자세히 분석해줘.
```

기존 기간과 주 지표는 유지하고 `device=mobile` Filter를 추가한다.

```text
작년 같은 기간과 비교해줘.
```

Mobile Filter는 유지하고 비교 기준만 `previousYear`로 변경한다.

### 4.4 History

사용자는 최근 분석을 다시 열 수 있다. MVP에서는 Local Storage를 사용하고, 이후 Phase에서 Supabase 저장을 선택적으로 추가한다.

## 5. 대표 Demo Scenario

Portfolio Demo에서는 다음 흐름이 안정적으로 동작해야 한다.

1. 사용자가 `지난달 매출이 왜 감소했어?`를 제출한다.
2. UI가 모델의 숨은 추론이 아닌 이해 가능한 작업 상태를 보여준다.
3. 생성된 Dashboard에서 전체 매출 감소를 확인한다.
4. 결정론적 Finding이 합성 데이터의 Mobile과 Fashion을 주요 하락 기여 Segment로 식별한다.
5. 사용자가 `모바일만 자세히 분석해줘.`를 제출한다.
6. 기존 기간은 유지되고 Mobile Filter가 추가된다.
7. 사용자가 `작년 같은 기간과 비교해줘.`를 제출한다.
8. Mobile Filter는 유지되고 비교 조건만 바뀐다.
9. 분석이 History에 저장되고 다시 열 수 있다.
10. 동일한 시나리오가 API Key 없는 Mock Mode에서도 동작한다.

## 6. 화면 구성

### `/`

Home과 탐색 화면:

- 제품 설명
- Prompt Input
- 추천 질문
- 사용 가능한 데이터 기간
- `Mock AI` 또는 `Live AI` 표시
- 최근 분석 3개

### `/dashboard/[id]`

생성된 Dashboard 화면:

- 제목과 쉬운 요약
- 기간, 비교 조건, Filter Chip
- 현재 분석 상태
- Widget Grid
- Insight에서 Finding 근거로 이동할 수 있는 연결
- 후속 질문 Prompt
- Retry와 복구 가능한 Error UI
- Context Phase 이후 Version History
- Editor Phase 이후 편집 기능

### `/history`

최근 분석 목록:

- 질문
- 생성된 제목
- 생성 시각
- Context 요약
- Provider Mode
- 다시 열기
- 삭제

## 7. MVP 범위

MVP에 포함한다.

- Next.js App Router
- Local Synthetic E-commerce Dataset
- Mock AI Provider
- 선택적 Gemini Provider
- 자연어 질문을 제한된 Query DSL로 변환
- 결정론적 Query와 Analysis Engine
- 제한된 Dashboard Schema
- React Component Registry
- 대표 질문과 후속 질문
- Local History와 세션별 분석 버전 복원
- 차트 선택 상세 분석, Filter 제거와 비교 조건 변경
- Drag, Resize, Delete, 표시 Type 변경, Undo, Redo
- 반응형 UI
- 접근 가능한 Loading, Chart, Error, Keyboard Interaction
- Unit, Integration, E2E Test

## 8. 지원 분석 Domain

데이터 범주:

- Orders
- Products
- Customers
- Traffic
- Marketing

지원 지표 범주:

- 매출과 주문 성과
- Traffic과 Conversion
- 고객 수
- 광고 효율
- 환불 성과

지원 차원:

- Date
- Device
- Category
- Product
- Traffic Source
- Region
- Customer Segment
- Campaign

정확한 Allowlist와 계산식은 `ANALYTICS_AI_SPEC.md`를 따른다.

## 9. 사용자에게 보이는 분석 상태

다음 상태 문구를 사용할 수 있다.

```text
질문 이해 중
데이터 준비 중
변화와 주요 요인 계산 중
대시보드 구성 중
```

이는 제품 진행 상태이며 모델의 숨은 Chain of Thought를 표시하는 기능이 아니다.

목표 상태 (전체 구현 완료 목록은 아니며 현재 제한은 `ARCHITECTURE.md` 13절 참고):

- Idle
- Submitting
- Planning
- Querying
- Calculating
- Composing
- Success
- Partial Success
- Cancelled
- Rate Limited
- Recoverable Failure
- Unsupported Question
- Empty Data

후속 질문을 처리하는 동안 새 결과가 준비되기 전까지 기존 성공 Dashboard를 유지한다.

## 10. MVP 이후 선택 기능

핵심 Demo를 막지 않는 범위에서 이후 추가한다.

- Supabase History
- 공유 가능한 Dashboard Link
- Widget 단위 자연어 편집
- 저장된 Dashboard Template
- PNG 또는 PDF Export
- 협업
- 실제 고객 데이터 연결
- 여러 Analytics Domain

## 11. MVP 비목표

다음은 MVP에서 만들지 않는다.

- 모델 학습 또는 Fine-tuning
- 임의 SQL 생성과 실행
- AI가 만든 React 코드 실행
- 제한 없는 Custom Formula
- Enterprise IAM
- Multi-tenant Billing
- 실제 고객 정보 또는 개인정보
- Web Search Grounding
- Native Mobile App
- Tableau, Looker, Power BI 전체 대체

## 12. 제품 완료 조건

Portfolio 공개 준비가 완료되려면 다음을 만족해야 한다.

- 대표 Demo Scenario가 Mock Mode에서 반복 가능하다.
- 표시 숫자가 LLM Text가 아닌 Analytics Engine에서 나온다.
- 서로 다른 지원 질문이 의미 있게 다른 Dashboard를 만든다.
- 후속 질문 Context가 올바르게 유지된다.
- AI 실패 시 이전 Dashboard를 잃지 않고 Fallback한다.
- 지원하지 않는 질문에 지원 Domain과 예시를 알려준다.
- Mobile과 Desktop에서 Layout이 정상 동작한다.
- Raw JSON이나 Log를 보지 않아도 핵심 Finding을 이해할 수 있다.
- README가 Architecture와 Safety Boundary를 설명한다.
