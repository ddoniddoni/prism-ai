# 성능 측정

## 범위와 재현 방법

이 문서는 Dashboard 초기 경로와 지연 로드 기능의 **프로덕션 정적 번들
크기**를 기록한다. 브라우저 런타임의 LCP, INP, 네트워크 지연을 추정하거나
대신하지 않는다.

```bash
npm run build
npm run analyze:bundle
```

- 기준 빌드: Next.js 16.3.3, Webpack production build
- 측정일: 2026-09-01
- `scripts/measure-bundle.ts`가 `.next` manifest에 등록된 JavaScript와 CSS
  파일을 읽어 원본 크기와 gzip level 9 크기를 합산한다.
- 초기 Dashboard 그룹에는 framework root, polyfill, `AnalysisDashboard`, Query
  Provider 및 route CSS가 포함된다.
- Editor와 세 Chart는 `next/dynamic`으로 초기 Dashboard 경로에서 분리되어
  있으며, 해당 Widget이 렌더링될 때만 요청된다.

## 결과

| 그룹 | 파일 수 | 원본 | gzip |
| --- | ---: | ---: | ---: |
| Dashboard 초기 Client Assets | 12 | 748.7 KiB | 223.6 KiB |
| Dashboard Editor on demand | 2 | 94.4 KiB | 28.2 KiB |
| Trend Chart on demand | 4 | 314.2 KiB | 103.6 KiB |
| Donut Chart on demand | 2 | 218.6 KiB | 73.5 KiB |
| Ranked Bar Chart on demand | 4 | 299.0 KiB | 98.2 KiB |
| 모든 Chart chunk (중복 제거) | 7 | 398.5 KiB | 130.7 KiB |

Chart별 행은 Nivo와 React 공통 chunk를 공유하므로 서로 더하면 안 된다. 마지막
행은 Trend, Donut, Ranked Bar Chart를 모두 로드했을 때 공유 파일을 한 번만 센
값이다.

## 해석과 다음 측정

현재 결과는 초기 Dashboard 전송량에서 편집기와 Nivo Chart bundle을 분리하고
있음을 확인한다. 다만 압축 알고리즘, CDN, cache 상태, 실제 기기 성능은 이
정적 결과에 포함되지 않는다. 배포 환경이 정해지면 대표 Desktop·Mobile
시나리오에서 Web Vitals와 network waterfall을 별도로 측정한다.
