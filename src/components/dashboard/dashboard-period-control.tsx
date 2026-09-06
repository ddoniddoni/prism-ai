"use client";

import { useState, type FormEvent } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import {
  analyticsPeriodSchema,
  periodPresets,
  type AnalyticsPeriod,
} from "@/lib/analytics/query-schema";
import { getPeriodLabel } from "./formatters";

export function DashboardPeriodControl({
  period,
  disabled,
  onChange,
}: {
  period: AnalyticsPeriod;
  disabled: boolean;
  onChange: (period: AnalyticsPeriod) => void;
}) {
  const [preset, setPreset] = useState(period.preset);
  const [startDate, setStartDate] = useState(period.startDate ?? "");
  const [endDate, setEndDate] = useState(period.endDate ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const result = analyticsPeriodSchema.safeParse({
      preset,
      startDate,
      endDate,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "기간을 확인해 주세요.");
      return;
    }
    setError("");
    onChange(result.data);
  }

  return (
    <div className="min-w-0">
      <label className="inline-flex">
        <span className="sr-only">분석 기간</span>
        <NativeSelect
          aria-label="분석 기간"
          density="compact"
          disabled={disabled}
          value={preset}
          onChange={(event) => {
            const next = periodPresets.find(
              (value) => value === event.target.value,
            );
            if (!next) return;
            setPreset(next === "custom" ? next : period.preset);
            setError("");
            if (next !== "custom") onChange({ preset: next });
          }}
        >
          {periodPresets.map((value) => (
            <option key={value} value={value}>
              {value === "custom"
                ? "직접 설정"
                : getPeriodLabel({ preset: value })}
            </option>
          ))}
        </NativeSelect>
      </label>
      {preset === "custom" ? (
        <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={submit}>
          <label className="grid gap-1 text-[11px]">
            시작일
            <input
              aria-label="분석 시작일"
              className="min-h-11 min-w-0 rounded-lg border border-[#dde2e8] bg-white px-2"
              type="date"
              required
              disabled={disabled}
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-[11px]">
            종료일
            <input
              aria-label="분석 종료일"
              className="min-h-11 min-w-0 rounded-lg border border-[#dde2e8] bg-white px-2"
              type="date"
              required
              disabled={disabled}
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <button
            className="dashboard-toolbar-button"
            disabled={disabled}
            type="submit"
          >
            기간 적용
          </button>
          {error ? (
            <p className="w-full text-[#ba1a1a]" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
