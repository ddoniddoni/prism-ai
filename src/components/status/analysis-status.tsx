export const analysisStages = [
  "idle",
  "planning",
  "querying",
  "calculating",
  "composing",
  "ready",
] as const;

export type AnalysisStage = (typeof analysisStages)[number];

const stageCopy: Record<AnalysisStage, { label: string; description: string }> =
  {
    idle: {
      label: "대기 중",
      description: "질문을 입력하면 분석 준비를 시작합니다.",
    },
    planning: {
      label: "질문 이해 중",
      description: "검증 가능한 분석 범위를 준비하고 있습니다.",
    },
    querying: {
      label: "데이터 준비 중",
      description: "선택된 데이터 범위를 확인하고 있습니다.",
    },
    calculating: {
      label: "변화와 주요 요인 계산 중",
      description: "결정론적 분석 결과를 만드는 단계입니다.",
    },
    composing: {
      label: "대시보드 구성 중",
      description: "검증된 데이터 참조로 위젯을 배치하고 있습니다.",
    },
    ready: {
      label: "준비 완료",
      description: "분석 결과를 확인할 수 있습니다.",
    },
  };

type AnalysisStatusProps = {
  stage: AnalysisStage;
};

export function AnalysisStatus({ stage }: AnalysisStatusProps) {
  const copy = stageCopy[stage];
  const active = stage !== "idle" && stage !== "ready";

  return (
    <section
      aria-live="polite"
      className="flex items-start gap-3 border border-slate-900/10 bg-white/75 p-4"
      role="status"
    >
      <span
        aria-hidden="true"
        className={`mt-1.5 size-2 rounded-full ${active ? "bg-[#ffb45e]" : "bg-[#67d8c8]"}`}
      />
      <div>
        <p className="text-sm font-semibold text-[#151a2d]">{copy.label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {copy.description}
        </p>
      </div>
    </section>
  );
}
