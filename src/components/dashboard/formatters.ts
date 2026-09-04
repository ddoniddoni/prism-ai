import type { DimensionKey } from "@/lib/analytics/dimension-catalog";
import type { MetricKey } from "@/lib/analytics/metric-catalog";
import type {
  AnalyticsPeriod,
  CompareMode,
  PeriodPreset,
} from "@/lib/analytics/query-schema";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const countFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
});

function formatCompactNumber(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 100_000_000) {
    return `${compactNumberFormatter.format(value / 100_000_000)}억`;
  }

  if (absoluteValue >= 10_000) {
    return `${compactNumberFormatter.format(value / 10_000)}만`;
  }

  if (absoluteValue >= 1_000) {
    return `${compactNumberFormatter.format(value / 1_000)}천`;
  }

  return compactNumberFormatter.format(value);
}

const dimensionValueLabels: Readonly<Record<string, string>> = {
  Beauty: "뷰티",
  Busan: "부산",
  Daejeon: "대전",
  Desktop: "데스크톱",
  Electronics: "전자제품",
  Fashion: "패션",
  Gyeonggi: "경기도",
  "Gyeonggi-do": "경기도",
  Home: "홈리빙",
  Jeju: "제주",
  Mobile: "모바일",
  Seoul: "서울",
  Sports: "스포츠",
  Tablet: "태블릿",
  "Beauty retargeting": "뷰티 리타겟팅",
  "Brand search": "브랜드 검색",
  "Electronics retargeting": "전자제품 리타겟팅",
  "Everyday Sneakers": "데일리 스니커즈",
  "Fashion retargeting": "패션 리타겟팅",
  "Home retargeting": "홈리빙 리타겟팅",
  "Orbit Wireless Earbuds": "오빗 무선 이어폰",
  "Quiet Air Purifier": "저소음 공기청정기",
  "Sports retargeting": "스포츠 리타겟팅",
  "Trail Running Bottle": "트레일 러닝 보틀",
  "Vitamin C Serum": "비타민 C 세럼",
  desktop: "데스크톱",
  direct: "직접 유입",
  email: "이메일",
  mobile: "모바일",
  new: "신규 고객",
  organicSearch: "자연 검색",
  paidSocial: "유료 소셜",
  returning: "재방문 고객",
  tablet: "태블릿",
  vip: "VIP 고객",
};

const analyticsCopyLabels: Readonly<Record<string, string>> = {
  "Key insights on product revenue ranking in Gyeonggi-do":
    "경기도 상품별 매출 순위의 핵심 근거",
  "Ranked list of products by revenue in Gyeonggi-do":
    "경기도 상품별 매출 순위",
  "Top Products Ranking": "상품 순위",
  "Ranking Analysis": "순위 분석",
  "Selected evidence": "선택한 근거",
  "Generated from verified refs": "검증된 데이터 기반",
  "Query ref": "검증 데이터 근거",
  Evidence: "검증 근거",
  unavailable: "확인 불가",
};

const periodPresetLabels: Readonly<Record<PeriodPreset, string>> = {
  custom: "직접 선택",
  last7Days: "최근 7일",
  last30Days: "최근 30일",
  last90Days: "최근 90일",
  lastMonth: "지난달",
  lastQuarter: "지난 분기",
  lastYear: "작년",
  thisMonth: "이번 달",
  thisQuarter: "이번 분기",
  thisYear: "올해",
};

export function formatDimensionValue(
  _dimension: DimensionKey | undefined,
  value: string,
): string {
  return dimensionValueLabels[value] ?? value;
}

export function localizeAnalyticsText(value: string): string {
  return Object.entries({ ...dimensionValueLabels, ...analyticsCopyLabels })
    .toSorted(([left], [right]) => right.length - left.length)
    .reduce(
      (localized, [source, replacement]) =>
        localized.replaceAll(source, replacement),
      value,
    );
}

export function getPeriodLabel(period: AnalyticsPeriod): string {
  if (period.preset === "custom" && period.startDate && period.endDate) {
    return `${period.startDate} ~ ${period.endDate}`;
  }

  return periodPresetLabels[period.preset];
}

export function formatMetricValue(
  metric: MetricKey,
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (
    metric === "revenue" ||
    metric === "averageOrderValue" ||
    metric === "adSpend"
  ) {
    return currencyFormatter.format(value);
  }

  if (metric === "conversionRate" || metric === "refundRate") {
    return `${value.toFixed(1)}%`;
  }

  if (metric === "roas") {
    return `${value.toFixed(2)}×`;
  }

  return countFormatter.format(value);
}

export function formatMetricAxisValue(
  metric: MetricKey,
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (
    metric === "revenue" ||
    metric === "averageOrderValue" ||
    metric === "adSpend"
  ) {
    return `₩${formatCompactNumber(value)}`;
  }

  if (metric === "conversionRate" || metric === "refundRate") {
    return `${value.toFixed(1)}%`;
  }

  if (metric === "roas") {
    return `${value.toFixed(1)}×`;
  }

  return formatCompactNumber(value);
}

export function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "비교 불가";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatChangeWithDirection(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return formatChange(value);
  }

  const direction = value > 0 ? "상승" : value < 0 ? "하락" : "변화 없음";

  return `${formatChange(value)} ${direction}`;
}

export function getComparisonLabel(compareWith: CompareMode): string {
  const labels: Record<CompareMode, string> = {
    none: "비교 없음",
    previousPeriod: "이전 기간 대비",
    previousMonth: "이전 달 대비",
    previousYear: "전년 동기 대비",
  };

  return labels[compareWith];
}
