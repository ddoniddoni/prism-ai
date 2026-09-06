"use client";

import { ArrowUpRight, MessageSquareText } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

type FollowUpPromptProps = {
  disabled: boolean;
  onSubmit: (question: string) => void;
};

export function FollowUpPrompt({ disabled, onSubmit }: FollowUpPromptProps) {
  const [question, setQuestion] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const normalizedQuestion = question.trim();

    if (normalizedQuestion.length < 2) {
      setValidationMessage("후속 질문은 두 글자 이상 입력해 주세요.");
      inputRef.current?.focus();
      return;
    }

    setValidationMessage(null);
    onSubmit(normalizedQuestion);
    setQuestion("");
  }

  return (
    <section
      aria-labelledby="follow-up-title"
      className="rounded-xl border border-[#dde2e8] bg-white p-4 sm:p-5"
    >
      <form
        aria-busy={disabled}
        className="flex flex-col gap-4 lg:flex-row lg:items-center"
        onSubmit={handleSubmit}
      >
        <div className="flex shrink-0 items-center gap-3 lg:w-64">
          <span className="grid size-9 place-items-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
            <MessageSquareText aria-hidden="true" className="size-[17px]" />
          </span>
          <div>
            <h2
              className="text-[13px] font-semibold text-[#191c1e]"
              id="follow-up-title"
            >
              이어서 분석하기
            </h2>
            <p className="mt-0.5 text-[11px] text-[#777587]">
              바꾸지 않은 분석 조건은 이어집니다
            </p>
          </div>
        </div>
        <label className="sr-only" htmlFor="follow-up-question">
          후속 분석 질문
        </label>
        <input
          autoComplete="off"
          aria-describedby={validationMessage ? "follow-up-error" : undefined}
          aria-invalid={Boolean(validationMessage)}
          className="h-11 min-w-0 flex-1 rounded-lg border border-[#dde2e8] bg-[#f8f9fb] px-3 text-[13px] text-[#191c1e] outline-none placeholder:text-[#9296a0] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 disabled:cursor-not-allowed disabled:bg-[#e7e8ea]"
          disabled={disabled}
          enterKeyHint="send"
          id="follow-up-question"
          maxLength={300}
          name="follow-up-question"
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.nativeEvent.isComposing || event.keyCode === 229)
            )
              event.preventDefault();
          }}
          placeholder="예: 모바일만 자세히 분석해줘…"
          ref={inputRef}
          value={question}
        />
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] disabled:cursor-not-allowed disabled:bg-[#9296a0]"
          disabled={disabled}
          type="submit"
        >
          {disabled ? "분석 준비 중" : "후속 분석"}
          {!disabled ? (
            <ArrowUpRight aria-hidden="true" className="size-4" />
          ) : null}
        </button>
      </form>
      {validationMessage ? (
        <p
          className="mt-3 text-[12px] text-[#ba1a1a]"
          id="follow-up-error"
          role="alert"
        >
          {validationMessage}
        </p>
      ) : null}
    </section>
  );
}
