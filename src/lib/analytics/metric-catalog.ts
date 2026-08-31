import type { DimensionKey } from "./dimension-catalog";

export const metricKeys = [
  "revenue",
  "orders",
  "unitsSold",
  "averageOrderValue",
  "customers",
  "sessions",
  "conversionRate",
  "adSpend",
  "roas",
  "refundRate",
] as const;

export type MetricKey = (typeof metricKeys)[number];

export type MetricFormat = "currency" | "count" | "percent" | "ratio";

export type MetricAggregation = "sum" | "derived";

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  description: string;
  format: MetricFormat;
  aggregation: MetricAggregation;
  comparable: boolean;
  availableDimensions: readonly DimensionKey[];
};

const allDimensions = [
  "date",
  "device",
  "category",
  "product",
  "trafficSource",
  "region",
  "customerSegment",
  "campaign",
] as const satisfies readonly DimensionKey[];

export const metricCatalog: Readonly<Record<MetricKey, MetricDefinition>> = {
  revenue: {
    key: "revenue",
    label: "매출",
    description: "선택 기간의 순매출 합계입니다.",
    format: "currency",
    aggregation: "sum",
    comparable: true,
    availableDimensions: allDimensions,
  },
  orders: {
    key: "orders",
    label: "주문 수",
    description: "선택 기간의 유효 주문 수 합계입니다.",
    format: "count",
    aggregation: "sum",
    comparable: true,
    availableDimensions: allDimensions,
  },
  unitsSold: {
    key: "unitsSold",
    label: "판매 수량",
    description: "선택 기간의 판매 수량 합계입니다.",
    format: "count",
    aggregation: "sum",
    comparable: true,
    availableDimensions: allDimensions,
  },
  averageOrderValue: {
    key: "averageOrderValue",
    label: "평균 주문 금액",
    description: "매출을 유효 주문 수로 나눈 값입니다.",
    format: "currency",
    aggregation: "derived",
    comparable: true,
    availableDimensions: allDimensions,
  },
  customers: {
    key: "customers",
    label: "고객 수",
    description: "선택 기간의 일별 집계 고객 수 합계입니다.",
    format: "count",
    aggregation: "sum",
    comparable: true,
    availableDimensions: allDimensions,
  },
  sessions: {
    key: "sessions",
    label: "세션",
    description: "선택 기간의 세션 합계입니다.",
    format: "count",
    aggregation: "sum",
    comparable: true,
    availableDimensions: allDimensions,
  },
  conversionRate: {
    key: "conversionRate",
    label: "전환율",
    description: "유효 주문 수를 세션으로 나눈 비율입니다.",
    format: "percent",
    aggregation: "derived",
    comparable: true,
    availableDimensions: allDimensions,
  },
  adSpend: {
    key: "adSpend",
    label: "광고비",
    description: "선택 기간의 광고비 합계입니다.",
    format: "currency",
    aggregation: "sum",
    comparable: true,
    availableDimensions: allDimensions,
  },
  roas: {
    key: "roas",
    label: "ROAS",
    description: "광고 귀속 매출을 광고비로 나눈 값입니다.",
    format: "ratio",
    aggregation: "derived",
    comparable: true,
    availableDimensions: allDimensions,
  },
  refundRate: {
    key: "refundRate",
    label: "환불률",
    description: "환불 주문 수를 유효 주문 수로 나눈 비율입니다.",
    format: "percent",
    aggregation: "derived",
    comparable: true,
    availableDimensions: allDimensions,
  },
};
