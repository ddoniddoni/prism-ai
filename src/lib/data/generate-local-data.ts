import type { AnalyticsDailyRow } from "@/lib/data/repository";

type ProductDefinition = {
  category: string;
  product: string;
  unitPrice: number;
  baseOrders: number;
};

type DeviceDefinition = {
  device: AnalyticsDailyRow["device"];
  orderMultiplier: number;
  conversionRate: number;
};

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;

export const LOCAL_DATASET_VERSION = "synthetic-ecommerce-v1";
export const LOCAL_DATASET_START_DATE = "2024-09-01";
export const LOCAL_DATASET_END_DATE = "2026-08-30";

const products: readonly ProductDefinition[] = [
  {
    category: "Electronics",
    product: "Orbit Wireless Earbuds",
    unitPrice: 148_000,
    baseOrders: 34,
  },
  {
    category: "Fashion",
    product: "Everyday Sneakers",
    unitPrice: 89_000,
    baseOrders: 51,
  },
  {
    category: "Home",
    product: "Quiet Air Purifier",
    unitPrice: 219_000,
    baseOrders: 24,
  },
  {
    category: "Beauty",
    product: "Vitamin C Serum",
    unitPrice: 42_000,
    baseOrders: 38,
  },
  {
    category: "Sports",
    product: "Trail Running Bottle",
    unitPrice: 31_000,
    baseOrders: 29,
  },
];

const devices: readonly DeviceDefinition[] = [
  { device: "desktop", orderMultiplier: 1, conversionRate: 0.052 },
  { device: "mobile", orderMultiplier: 0.87, conversionRate: 0.037 },
  { device: "tablet", orderMultiplier: 0.33, conversionRate: 0.041 },
];

const trafficSources = [
  "organicSearch",
  "paidSocial",
  "email",
  "direct",
] as const;
const regions = ["Seoul", "Gyeonggi", "Busan", "Daejeon", "Jeju"] as const;
const customerSegments = ["new", "returning", "vip"] as const;

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDayOfYear(date: Date) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((date.getTime() - startOfYear) / DAY_IN_MILLISECONDS) + 1;
}

function getWeeklyFactor(day: number) {
  return day === 0 || day === 6 ? 0.82 : 1;
}

function getSeasonalFactor(dayOfYear: number) {
  return 1 + Math.sin((dayOfYear / 365) * Math.PI * 2) * 0.08;
}

function getScenarioFactor(
  date: string,
  product: ProductDefinition,
  device: AnalyticsDailyRow["device"],
) {
  if (!date.startsWith("2026-07")) {
    return 1;
  }

  if (device === "desktop") {
    return 1.04;
  }

  if (product.category === "Fashion" && device === "mobile") {
    return 0.58;
  }

  if (product.product === "Everyday Sneakers") {
    return 0.74;
  }

  return 1;
}

function getCampaign(
  trafficSource: (typeof trafficSources)[number],
  category: string,
) {
  if (trafficSource === "paidSocial") {
    return `${category} retargeting`;
  }

  if (trafficSource === "organicSearch") {
    return "Brand search";
  }

  return null;
}

function roundCurrency(value: number) {
  return Math.round(value / 100) * 100;
}

export function generateAnalyticsDailyRows(): AnalyticsDailyRow[] {
  const random = createSeededRandom(42_027);
  const rows: AnalyticsDailyRow[] = [];
  const firstDay = new Date(`${LOCAL_DATASET_START_DATE}T00:00:00.000Z`);
  const lastDay = new Date(`${LOCAL_DATASET_END_DATE}T00:00:00.000Z`);
  let dayIndex = 0;

  for (
    let cursor = new Date(firstDay);
    cursor <= lastDay;
    cursor = new Date(cursor.getTime() + DAY_IN_MILLISECONDS)
  ) {
    const date = toIsoDate(cursor);
    const yearlyTrend = 1 + dayIndex * 0.00012;
    const seasonalFactor = getSeasonalFactor(getDayOfYear(cursor));
    const weeklyFactor = getWeeklyFactor(cursor.getUTCDay());

    products.forEach((product, productIndex) => {
      devices.forEach((deviceDefinition, deviceIndex) => {
        const trafficSource =
          trafficSources[
            (dayIndex + productIndex * 2 + deviceIndex) % trafficSources.length
          ];
        const region =
          regions[(dayIndex * 3 + productIndex + deviceIndex) % regions.length];
        const customerSegment =
          customerSegments[
            (dayIndex + productIndex + deviceIndex * 2) %
              customerSegments.length
          ];
        const campaign = getCampaign(trafficSource, product.category);
        const scenarioFactor = getScenarioFactor(
          date,
          product,
          deviceDefinition.device,
        );
        const dailyNoise = 0.92 + random() * 0.16;
        const orders = Math.max(
          1,
          Math.round(
            product.baseOrders *
              deviceDefinition.orderMultiplier *
              weeklyFactor *
              seasonalFactor *
              yearlyTrend *
              scenarioFactor *
              dailyNoise,
          ),
        );
        const unitsSold = Math.max(
          orders,
          Math.round(orders * (1.03 + random() * 0.22)),
        );
        const revenue = roundCurrency(
          unitsSold * product.unitPrice * (0.96 + random() * 0.08),
        );
        const sessions = Math.round(
          orders / (deviceDefinition.conversionRate * (0.94 + random() * 0.12)),
        );
        const customers = Math.min(
          orders,
          Math.max(1, Math.round(orders * (0.71 + random() * 0.18))),
        );
        const paidChannel =
          trafficSource === "paidSocial" || trafficSource === "organicSearch";
        const campaignPressure =
          date.startsWith("2026-07") &&
          product.category === "Fashion" &&
          deviceDefinition.device === "mobile"
            ? 1.34
            : 1;
        const adSpend = roundCurrency(
          revenue *
            (paidChannel ? 0.16 + random() * 0.06 : 0.018 + random() * 0.018) *
            campaignPressure,
        );
        const attributionRate =
          date.startsWith("2026-07") &&
          product.category === "Fashion" &&
          deviceDefinition.device === "mobile"
            ? 0.42
            : paidChannel
              ? 0.66
              : 0.12;
        const attributedRevenue = roundCurrency(revenue * attributionRate);
        const refundRate =
          region === "Jeju"
            ? 0.11
            : product.category === "Fashion"
              ? 0.056
              : 0.024;
        const refunds = Math.min(
          orders,
          Math.round(orders * refundRate * (0.9 + random() * 0.2)),
        );

        rows.push({
          date,
          device: deviceDefinition.device,
          category: product.category,
          product: product.product,
          trafficSource,
          region,
          customerSegment,
          campaign,
          revenue,
          orders,
          unitsSold,
          customers,
          sessions,
          adSpend,
          attributedRevenue,
          refunds,
        });
      });
    });

    dayIndex += 1;
  }

  return rows;
}
