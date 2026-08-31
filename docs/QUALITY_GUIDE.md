# 품질, 보안, 배포 기준

## 1. 품질 목표

Prism AI는 AI Output 오류, Empty Data, 일부 Query 실패, Request Cancel, Live Provider 장애에서도 복구 가능해야 한다. Happy Path API Demo가 아니라 방어적인 Frontend와 Application Architecture를 보여주는 것이 목표다.

## 2. Type과 Code 기준

- TypeScript strict 유지
- `any`, 넓은 Type Cast, `@ts-ignore`, Lint 비활성화 지양
- Widget, Request State, Error에는 Discriminated Union 우선
- Domain Type을 한 곳에서 소유하고 중복 선언하지 않음
- 단위, Percent, Date Range, Nullable Result를 함수 이름과 Type으로 명확히 표현
- Formula와 Schema Sanitizing은 Pure Function 우선
- Side Effect는 Provider, Repository, Persistence, HTTP Boundary에 제한
- 의미 있는 Boundary를 지키지 않는 과도한 추상화 금지
- 빈 `catch`로 Error 은폐 금지
- Typed Domain Error를 만들고 HTTP Boundary에서 변환

## 3. 필수 Unit Test

Analytics:

- Query DSL Validation
- 유효한 Custom Period와 잘못된 Period
- Previous Period 계산
- Filter Normalize와 Deduplication
- GroupBy Aggregation
- Limit와 Sort
- Division by Zero
- Percent와 Absolute Change
- Contribution
- Ranking
- Anomaly Threshold
- Finding 생성
- Insufficient Data

AI Schema:

- 유효한 AnalysisPlan
- 등록되지 않은 Metric과 Dimension 거부
- Query 수 제한
- 유효한 DashboardSpec
- 등록되지 않은 Widget 거부
- Widget Type별 Config
- 잘못된 Query와 Finding 참조 제거
- 모든 Widget 제거 후 Fallback

Context:

- 초기 Context 생성
- Patch Merge
- 언급하지 않은 Period와 Filter 유지
- 명시적으로 변경한 Compare Mode 적용
- 명시적으로 바꾼 Filter 교체 또는 제거

Mock Provider:

- 대표 질문 전체
- Schema 준수
- Data Value Hardcode 없음

## 4. 필수 Integration Test

- `POST /api/analyze` Request Validation
- Mock Plan부터 Repository, Finding, Composer, Response까지
- Unsupported Question Error Mapping
- 잘못된 AI Output 거부
- 교정 Retry 1회 후 Fallback
- Partial Query Success
- Cancelled Request
- 중복 Request ID
- 구현 이후 Cache Hit
- 구현 이후 Rate Limit
- Test Environment에서 Live Gemini 호출 없음

## 5. 필수 E2E Test

대표 흐름:

```text
Home
-> 매출 하락 질문 제출
-> 진행 상태 확인
-> Dashboard 생성
-> 핵심 매출과 Driver Widget 확인
-> Mobile 후속 질문 제출
-> Mobile Filter 확인
-> Previous Year 후속 질문 제출
-> Compare Context 확인
-> History 열기
-> Analysis 다시 열기
```

추가 Scenario:

- Unsupported Question
- Empty Result
- Recoverable Provider Failure
- Mobile Viewport
- Keyboard만으로 Prompt 제출과 Dashboard 탐색

Fixed Seed Data와 Deterministic Mock Output을 사용한다.

## 6. 보안 규칙

- Secret Key를 Browser에 전달하지 않는다.
- Secret Variable에 `NEXT_PUBLIC_`을 붙이지 않는다.
- User Input이나 Model Output을 `dangerouslySetInnerHTML`로 렌더링하지 않는다.
- `eval`, `Function`, Model Output 기반 Dynamic Import, Runtime JSX Compile을 사용하지 않는다.
- AI가 만든 SQL을 실행하지 않는다.
- 모든 HTTP Input과 저장된 History Data를 검증한다.
- 일반 Text는 React 기본 Escape를 사용한다.
- Error Log에서 Payload를 Masking한다.
- Prompt, Key, 민감 정보가 Client Error Message에 나오지 않게 한다.
- Portfolio Repository에는 Synthetic Data만 사용한다.
- Supabase Table을 공개하기 전에 RLS Policy를 작성한다.
- Provider와 Secret Client는 Server 전용 Module로 분리한다.

## 7. AI 신뢰성 규칙

- 모든 표시 숫자는 `AnalyticsDataset` 또는 `Finding`에서 나온다.
- AI Insight는 Evidence ID를 참조한다.
- 검증되지 않은 인과관계를 단정하지 않는다.
- 데이터 부족과 Partial Result를 명시한다.
- 숨은 Model Reasoning을 노출하지 않고 상태와 근거만 보여준다.
- 검증되지 않은 Raw Model Output을 저장하거나 렌더링하지 않는다.
- 모든 Live Model 단계에 Deterministic Fallback이 있다.

## 8. 접근성

최소 요구사항:

- Semantic Heading과 Landmark
- 보이는 Keyboard Focus
- Prompt Control Label과 Description
- 적절한 Live Region으로 Status 전달
- Error와 관련 Control 연결
- Color만으로 정보 구분 금지
- 상승과 하락에 Text Indicator 제공
- Chart Summary Text
- 중요한 Chart Data의 Table 대체 보기
- 충분한 Contrast
- Reduced Motion 지원
- Widget Action Keyboard 접근
- Mobile에 적절한 Touch Target

Interactive Chart가 Keyboard Focus를 가두지 않게 하고, Tooltip만으로 핵심 값을 제공하지 않는다.

## 9. 반응형 기준

- Mobile: Dashboard 한 Column
- Tablet: 가독성을 유지하는 범위에서 두 Column
- Desktop: 12 Column Grid
- Chart와 Table의 Page Horizontal Overflow 방지
- Dense Table에만 내부 Scroll 허용
- 좁은 화면에서도 Prompt와 Follow-up 사용 가능
- 대표 Mobile과 Desktop Viewport에서 Test

## 10. 성능

측정 없이 최적화를 주장하지 않는다.

우선순위:

- Provider와 Repository Code를 Client Bundle에서 제외
- MVP 이후 Heavy Editor Feature Lazy Load
- Local Widget Interaction에서 전체 Dashboard 불필요한 Rerender 방지
- 비용이 확인된 경우에만 Derived Chart Data Memoization
- Browser로 보내는 Dataset 크기 제한
- 실제로 큰 Table만 Pagination 또는 Virtualization
- Stable Query Key
- 오래된 Analysis Request Cancel
- Follow-up Loading 중 Previous Data 유지

Portfolio에서 성능 개선을 설명할 때는 README에 측정 전후 결과를 기록한다.

## 11. Error와 복구 UX

- Invalid Input: Prompt Text 유지, Field Error 표시
- Unsupported Question: 지원 Domain과 예시 제공
- AI Unavailable: 기존 Dashboard 유지, Retry 또는 Mock Mode 제공
- Partial Data: 성공 Widget 렌더링, Partial Notice 표시
- Empty Data: 현재 Filter와 Reset Action 표시
- Rate Limit: 다시 시도 가능한 조건 안내, Cached Example 유지
- Cancelled Request: 진행 상태 중단, 기존 결과 유지

작은 범위에서 복구 가능한 오류를 전체 Page Generic Error로 바꾸지 않는다.

## 12. 금지 Pattern

```text
LLM SQL -> Database 직접 실행
LLM React 또는 HTML -> Runtime 실행 또는 Raw Rendering
LLM 숫자 -> Dataset 근거 없이 표시
API Key -> NEXT_PUBLIC Variable
Server Response -> Zustand에 전체 중복 저장
route.ts -> 모든 Business Logic
Client Component -> Gemini 또는 Supabase Secret 직접 호출
catch -> Error 무시
any 또는 ts-ignore -> Type 문제 은폐
Live Gemini -> 자동 테스트 의존성
yarn.lock, pnpm-lock.yaml, bun.lock -> Repository에 생성
AI 실패 -> 기존 성공 Dashboard 삭제
```

## 13. 검증 명령

개발 중:

```bash
npm run lint
npm run typecheck
npm run test
```

구현 작업 완료 전:

```bash
npm run check
```

사용자 흐름 변경 시:

```bash
npm run test:e2e
```

넓은 Formatting 변경 시:

```bash
npm run format:check
```

각 명령의 실제 종료 결과를 기록한다. 실행할 수 없으면 이유를 적고 통과했다고 표현하지 않는다.

## 14. Portfolio 배포 Check

Product:

- 대표 질문과 후속 질문 두 개 동작
- History에서 Analysis 다시 열기 가능
- Mock Mode가 명확히 표시됨
- Live Mode는 선택적
- Partial과 Error State가 의도적으로 설계됨

Engineering:

- npm만 사용
- Package Lock Commit
- Strict Type
- 검증된 Query DSL
- Deterministic Calculation
- 검증된 DashboardSpec
- Client Secret 없음
- Test Suite 통과
- Live API가 없어도 Demo 가능

Presentation:

- README가 문제와 Architecture를 설명
- Architecture Diagram과 실제 Code 일치
- Screenshot이 대표 결과를 사용
- Demo Video가 Deterministic Scenario를 사용
- Synthetic Data임을 표시
- Tradeoff와 Limitation을 솔직히 설명

## 15. 변경 단위 완료 기준

다음을 모두 만족해야 변경이 완료다.

1. 요청한 동작을 충족한다.
2. Module 배치가 `ARCHITECTURE.md`를 따른다.
3. Domain과 AI 동작이 `ANALYTICS_AI_SPEC.md`를 따른다.
4. 적절한 Level의 Test가 있다.
5. 관련 검증 명령이 통과한다.
6. 보안과 접근성이 악화되지 않는다.
7. `PROGRESS.md`에 결과와 제한 사항이 기록된다.
8. 공개 동작이나 Architecture가 바뀌면 문서도 갱신된다.
