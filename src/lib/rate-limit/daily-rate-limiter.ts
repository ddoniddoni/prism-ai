type RateLimitClock = () => Date;

type RateLimitCounter = {
  count: number;
  day: string;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number | null;
  retryAfterSeconds: number;
};

function getUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function secondsUntilNextUtcDay(date: Date): number {
  const nextDay = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );

  return Math.max(1, Math.ceil((nextDay - date.getTime()) / 1_000));
}

export function getDemoClientIdentity(request: Request): string {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const clientAddress =
    forwardedFor || request.headers.get("x-real-ip")?.trim() || "anonymous";

  return clientAddress.slice(0, 128);
}

export class DailyRateLimiter {
  private readonly counters = new Map<string, RateLimitCounter>();

  constructor(
    private readonly dailyLimit: number,
    private readonly now: RateLimitClock = () => new Date(),
  ) {}

  consume(clientIdentity: string): RateLimitDecision {
    if (this.dailyLimit === 0) {
      return { allowed: true, remaining: null, retryAfterSeconds: 0 };
    }

    const currentTime = this.now();
    const today = getUtcDay(currentTime);
    const counter = this.counters.get(clientIdentity);
    const currentCount = counter?.day === today ? counter.count : 0;
    const retryAfterSeconds = secondsUntilNextUtcDay(currentTime);

    if (currentCount >= this.dailyLimit) {
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    this.counters.set(clientIdentity, {
      day: today,
      count: currentCount + 1,
    });

    return {
      allowed: true,
      remaining: this.dailyLimit - currentCount - 1,
      retryAfterSeconds,
    };
  }
}
