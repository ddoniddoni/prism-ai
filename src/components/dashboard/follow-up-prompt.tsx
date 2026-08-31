"use client";

import { useState, type FormEvent } from "react";

type FollowUpPromptProps = {
  disabled: boolean;
  onSubmit: (question: string) => void;
};

export function FollowUpPrompt({ disabled, onSubmit }: FollowUpPromptProps) {
  const [question, setQuestion] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuestion = question.trim();

    if (normalizedQuestion.length < 2) {
      setValidationMessage("후속 질문은 두 글자 이상 입력해 주세요.");
      return;
    }

    setValidationMessage(null);
    onSubmit(normalizedQuestion);
    setQuestion("");
  }

  return (
    <section
      aria-labelledby="follow-up-title"
      className="border border-[#6657dd]/25 bg-[#f0efff] p-5 shadow-[0_18px_45px_-38px_rgba(21,26,45,0.72)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#5144bb] uppercase">
            Context thread
          </p>
          <h2
            className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#151a2d]"
            id="follow-up-title"
          >
            이 결과에서 이어서 분석하기
          </h2>
        </div>
        <span className="border border-[#6657dd]/25 bg-white px-2.5 py-1 font-mono text-[10px] text-[#5144bb]">
          기간·지표 유지
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        예: “모바일만 자세히 분석해줘”, “작년 같은 기간과 비교해줘”
      </p>
      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="follow-up-question">
          후속 분석 질문
        </label>
        <input
          aria-describedby={validationMessage ? "follow-up-error" : undefined}
          className="min-h-11 flex-1 border border-slate-900/15 bg-white px-3 text-sm text-[#151a2d] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={disabled}
          id="follow-up-question"
          maxLength={300}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="현재 분석에 이어서 물어보세요"
          value={question}
        />
        <button
          className="min-h-11 bg-[#151a2d] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#6657dd] focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={disabled}
          type="submit"
        >
          {disabled ? "분석 준비 중" : "후속 분석"}
        </button>
      </form>
      {validationMessage ? (
        <p
          className="mt-3 text-sm text-rose-700"
          id="follow-up-error"
          role="alert"
        >
          {validationMessage}
        </p>
      ) : null}
    </section>
  );
}
