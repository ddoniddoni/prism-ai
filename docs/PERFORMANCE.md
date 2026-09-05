# 성능 측정

## 범위와 재현 방법

이 문서는 Dashboard 초기 경로와 지연 로드 기능의 **프로덕션 정적 번들 크기**를
기록한다. 브라우저 런타임의 LCP, INP, 네트워크 지연을 추정하거나 대신하지 않는다.

```bash
npm run build
npm run analyze:bundle
```

- 기준 빌드: Next.js 16.3.3, Webpack production build
- 측정일: 2026-09-06, Dashboard 표현 모듈 분리 이후
- 이번 build는 `AI_PROVIDER=mock AI_LIVE_ENABLED=false DATA_SOURCE=local PERSIST_ANALYSIS_HISTORY=false`로 실행했다.
- `scripts/measure-bundle.ts`가 `.next` manifest의 JavaScript와 CSS를 읽고
  원본 크기와 gzip level 9 크기를 합산한다.
- 초기 Dashboard 그룹에는 framework root, polyfill, `AnalysisDashboard`, Query
  Provider 및 route CSS가 포함된다. 분석 API의 JSON 응답과 폰트는 포함하지 않는다.
- Editor는 분석 완료 뒤 로드된다. 편집 버튼을 눌렀을 때만 로드되는 구조는 아니다.
- 다섯 Chart는 해당 Widget이 렌더링될 때 동적으로 요청된다.
- 측정기는 동적 Import의 대상 Module 이름으로 파일을 찾는다. Widget Wrapper를
  다른 파일로 옮겨도 측정할 수 있고, 대상이 없으면 누락시키지 않고 오류를 낸다.

## 현재 결과

| 그룹 | 파일 수 | 원본 | gzip |
| --- | ---: | ---: | ---: |
| Dashboard 초기 Client Assets | 12 | 774.7 KiB | 229.9 KiB |
| Dashboard Editor on demand | 2 | 115.7 KiB | 33.3 KiB |
| Trend Chart on demand | 4 | 314.5 KiB | 103.8 KiB |
| Donut Chart on demand | 2 | 219.5 KiB | 73.9 KiB |
| Ranked Bar Chart on demand | 4 | 299.4 KiB | 98.4 KiB |
| Stacked Bar Chart on demand | 4 | 301.4 KiB | 99.1 KiB |
| Calendar Heatmap on demand | 1 | 8.3 KiB | 3.2 KiB |
| 다섯 Chart Chunk 전체, 중복 제거 | 9 | 414.6 KiB | 137.4 KiB |
| 초기 자산 + Editor + 다섯 Chart, 중복 제거 | 23 | 1305.0 KiB | 400.6 KiB |

Chart별 행은 Nivo와 React 공통 Chunk를 공유하므로 서로 더하면 안 된다.
마지막 행은 각 그룹의 파일 경로를 합친 뒤 중복을 제거한 결과다. 모든 Chart가
동시에 필요한 Dashboard의 자산 범위를 보여주며 모든 질문의 초기 전송량은 아니다.

## 이전 기록과 해석

2026-09-01 기록은 초기 자산 223.6 KiB gzip, 세 Chart의 중복 제거 합계
130.7 KiB gzip이었다. 이후 누적 막대·캘린더·상세 분석·조건 변경·버전 이력이
추가됐으므로 이번 수치를 리팩터링 전후의 성능 비교로 해석하지 않는다.
이번 작업은 책임 분리와 측정 범위 보완이며 번들 감소를 주장하지 않는다.

정적 Manifest에서 Editor와 Chart의 분리를 확인했다. 실제 전송량은 CDN 압축,
Cache와 사용 Widget에 따라 달라진다. 배포 환경이 정해지면 대표 Desktop·Mobile
시나리오에서 Web Vitals, API 응답 크기, Network Waterfall을 측정한다.

## 실행 기록

`npm run analyze:bundle`은 첫 시도에서 `tsx`의 로컬 IPC 소켓 생성이 Sandbox의
`EPERM`으로 차단됐다. 같은 읽기 전용 측정 명령을 승인된 Sandbox 밖에서
재실행해 종료 코드 0과 위 결과를 확인했다. 테스트·브라우저 시나리오는 실행하지 않았다.
