# AGENTS.md

## 저장소 목적

Prism AI는 사용자의 자연어 질문을 검증된 분석 계획으로 변환하고, 실제 데이터에서 결정론적으로 계산한 결과를 바탕으로 대시보드를 구성하는 Generative Analytics Dashboard다.

핵심 흐름:

```text
사용자 질문
-> AI Planner
-> 검증된 Query DSL
-> Repository와 Analytics Engine
-> 결정론적 Finding
-> AI Dashboard Composer
-> 검증된 DashboardSpec
-> React Component Registry
```

제품 요구사항과 상세 설계는 `docs/`에 둔다. `AGENTS.md`에는 모든 작업에서 반복 적용할 규칙만 유지한다. 기능 명세, 타입 정의, 구현 Phase, 긴 예시는 이 파일에 추가하지 않는다.

## 작업 전 문서 확인

모든 작업에서 `package.json`, 변경 대상 코드, `docs/PROGRESS.md`를 먼저 확인한다.

작업 성격에 따라 필요한 문서만 추가로 읽는다.

- 제품 동작, 사용자 흐름, 지원 범위: `docs/PROJECT_SPEC.md`
- 모듈 경계, 디렉터리, API 흐름, 상태 소유권: `docs/ARCHITECTURE.md`
- 지표, Query DSL, Finding, AI 출력, Dashboard Schema: `docs/ANALYTICS_AI_SPEC.md`
- 초기 설정, npm 의존성, 환경 변수, 구현 순서: `docs/IMPLEMENTATION_PLAN.md`
- 테스트, 보안, 접근성, 성능, 완료 기준: `docs/QUALITY_GUIDE.md`

코드와 문서가 충돌하면 임의로 한쪽을 선택하지 않는다. 사용자의 최신 요청을 우선하고, 관련 문서와 `docs/PROGRESS.md`에 변경 결정을 기록한다.

## 반드시 지킬 규칙

1. 패키지 매니저는 `npm`만 사용한다. Yarn, pnpm, Bun을 사용하지 않고 `package-lock.json`을 유지한다.
2. TypeScript strict를 유지한다. `any`, 무리한 타입 단언, `@ts-ignore`, 오류 은폐용 lint 비활성화를 추가하지 않는다.
3. Gemini와 Supabase 비밀키는 서버에서만 사용한다. 비밀키에 `NEXT_PUBLIC_`을 붙이지 않는다.
4. LLM이 만든 SQL, JavaScript, JSX, HTML, React 코드를 실행하거나 원문 렌더링하지 않는다.
5. LLM은 프로젝트 Schema에 등록된 지표, 차원, 쿼리, 위젯만 선택할 수 있다.
6. 모든 AI 출력은 JSON Schema와 Zod 검증을 통과한 뒤 사용한다.
7. 매출, 비율, 증감률, 기여도, 순위, 이상치는 애플리케이션 코드가 계산한다. LLM이 표시 숫자를 생성하거나 계산하지 않는다.
8. 외부 API Key가 없어도 Local Synthetic Data와 `MockAIProvider`로 전체 데모가 동작해야 한다.
9. 자동 테스트에서 실제 Gemini API를 호출하지 않는다.
10. React Component와 Route Handler에 비즈니스 로직을 몰아넣지 않는다. `docs/ARCHITECTURE.md`의 경계를 따른다.
11. Server Component를 기본으로 사용하고 브라우저 API나 사용자 상호작용이 필요한 최소 범위만 Client Component로 만든다.
12. 서버 상태는 TanStack Query, 대시보드 편집처럼 클라이언트가 소유하는 UI 상태만 Zustand로 관리한다.
13. 기존 스택으로 해결 가능한 작업에 불필요한 production dependency를 추가하지 않는다.
14. 사용자가 요청하지 않은 commit, push, reset, rebase, Git history 변경을 하지 않는다.
15. 후속 질문, AI 호출, 일부 Query가 실패해도 기존 성공 Dashboard를 제거하지 않는다. 복구 가능한 오류 상태를 제공한다.

## 코드 소유 경계

- `src/app`: 라우팅, Layout, Page 조합, Route Handler
- `src/components`: 재사용 가능한 표현과 상호작용 UI
- `src/lib/analytics`: Query DSL, 지표, 계산, Finding
- `src/lib/ai`: Provider, Prompt, Structured Output 검증, Fallback
- `src/lib/data`: Repository Interface와 Local 또는 Supabase 구현
- `src/stores`: 클라이언트가 소유하는 Editor 상태
- `src/test`, `tests`: 테스트 유틸리티, 통합 테스트, E2E

Component에서 Gemini 또는 Supabase를 직접 호출하지 않는다.

## 명령어

`package.json`의 script를 사용한다. 목표 명령어는 다음과 같다.

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run check
```

코드 변경 후 관련 범위 테스트를 먼저 실행하고, 작업 완료 전 `npm run check`를 실행한다. 사용자 흐름, 라우팅, Dashboard 렌더링, 저장 동작이 바뀌면 `npm run test:e2e`도 실행한다.

초기 Bootstrap에서 script가 없다면 다른 도구로 대체하지 말고 `docs/IMPLEMENTATION_PLAN.md`에 따라 추가한다.

## 작업 절차

1. 관련 문서와 현재 구현을 확인한다.
2. 복잡한 작업은 짧은 계획을 세운다.
3. 요청을 충족하는 가장 작은 단위로 구현한다.
4. 변경 동작에 맞는 테스트를 추가하거나 수정한다.
5. 검증 명령을 실행하고 Diff를 검토한다.
6. `docs/PROGRESS.md`에 완료 내용, 결정, 실제 검증 결과, 제한 사항, 다음 작업을 기록한다.
7. 종료 시 변경 파일과 실제 명령 결과를 요약한다. 실행하지 않은 명령을 통과했다고 표현하지 않는다.

## 완료 기준

요청한 동작이 작동하고, 관련 테스트가 있으며, 타입과 lint가 통과하고, 비밀키가 노출되지 않고, AI 출력이 검증되고, 표시 숫자의 원천이 결정론적 분석 모듈이며, 문서와 구현이 일치해야 완료다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
