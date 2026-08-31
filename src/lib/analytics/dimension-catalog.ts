export const dimensionKeys = [
  "date",
  "device",
  "category",
  "product",
  "trafficSource",
  "region",
  "customerSegment",
  "campaign",
] as const;

export type DimensionKey = (typeof dimensionKeys)[number];

export type DimensionDefinition = {
  key: DimensionKey;
  label: string;
  description: string;
  canFilter: boolean;
};

export const dimensionCatalog: Readonly<
  Record<DimensionKey, DimensionDefinition>
> = {
  date: {
    key: "date",
    label: "날짜",
    description: "일별 집계 기준입니다.",
    canFilter: false,
  },
  device: {
    key: "device",
    label: "디바이스",
    description: "Desktop, Mobile, Tablet 접점입니다.",
    canFilter: true,
  },
  category: {
    key: "category",
    label: "카테고리",
    description: "상품 카테고리입니다.",
    canFilter: true,
  },
  product: {
    key: "product",
    label: "상품",
    description: "판매 상품입니다.",
    canFilter: true,
  },
  trafficSource: {
    key: "trafficSource",
    label: "유입 소스",
    description: "방문 유입 채널입니다.",
    canFilter: true,
  },
  region: {
    key: "region",
    label: "지역",
    description: "주문이 발생한 지역입니다.",
    canFilter: true,
  },
  customerSegment: {
    key: "customerSegment",
    label: "고객 세그먼트",
    description: "신규, 재방문, VIP 고객 구분입니다.",
    canFilter: true,
  },
  campaign: {
    key: "campaign",
    label: "캠페인",
    description: "광고 또는 검색 캠페인입니다.",
    canFilter: true,
  },
};

export const filterableDimensionKeys = [
  "device",
  "category",
  "product",
  "trafficSource",
  "region",
  "customerSegment",
  "campaign",
] as const satisfies readonly Exclude<DimensionKey, "date">[];

export type FilterableDimensionKey = (typeof filterableDimensionKeys)[number];
