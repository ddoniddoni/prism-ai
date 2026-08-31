"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

const MINIMUM_QUESTION_LENGTH = 2;
const MAXIMUM_QUESTION_LENGTH = 300;

type PromptInputProps = {
  recommendedQuestions: readonly string[];
};

export function PromptInput({ recommendedQuestions }: PromptInputProps) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuestion = question.trim();

    if (normalizedQuestion.length < MINIMUM_QUESTION_LENGTH) {
      setError("분석할 질문을 두 글자 이상 입력해 주세요.");
      return;
    }

    if (normalizedQuestion.length > MAXIMUM_QUESTION_LENGTH) {
      setError("질문은 300자 이내로 입력해 주세요.");
      return;
    }

    setError(null);
    startTransition(() => {
      router.push(
        `/dashboard/mock-preview?question=${encodeURIComponent(normalizedQuestion)}`,
      );
    });
  }

  function chooseQuestion(nextQuestion: string) {
    setQuestion(nextQuestion);
    setError(null);
  }

  return (
    <div>
      <form aria-describedby="prompt-description" onSubmit={handleSubmit}>
        <label
          className="text-sm font-semibold text-[#151a2d]"
          htmlFor="analysis-question"
        >
          어떤 변화를 확인하고 싶나요?
        </label>
        <p
          className="mt-1 text-sm leading-6 text-slate-600"
          id="prompt-description"
        >
          자연어로 질문하면 다음 단계에서 검증된 분석 계획과 대시보드로
          연결합니다.
        </p>
        <div className="mt-4 border border-slate-900/15 bg-white shadow-[0_20px_45px_-36px_rgba(21,26,45,0.7)] transition-shadow focus-within:border-[#6657dd]/55 focus-within:shadow-[0_20px_45px_-32px_rgba(102,87,221,0.5)]">
          <textarea
            aria-invalid={error ? true : undefined}
            aria-errormessage={error ? "question-error" : undefined}
            className="min-h-32 w-full resize-y bg-transparent px-4 py-4 text-base leading-7 text-[#151a2d] outline-none placeholder:text-slate-400"
            id="analysis-question"
            maxLength={MAXIMUM_QUESTION_LENGTH}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="예: 지난달 매출이 왜 감소했어?"
            value={question}
          />
          <div className="flex items-center justify-between gap-4 border-t border-slate-900/8 px-3 py-3">
            <span
              className="font-mono text-[11px] text-slate-500"
              aria-live="polite"
            >
              {isPending
                ? "대시보드 셸을 여는 중"
                : `${question.length}/${MAXIMUM_QUESTION_LENGTH}`}
            </span>
            <button
              className="bg-[#151a2d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6657dd] focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-65"
              disabled={isPending}
              type="submit"
            >
              대시보드 초안 만들기
            </button>
          </div>
        </div>
        {error ? (
          <p
            className="mt-2 text-sm font-medium text-rose-700"
            id="question-error"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>

      <section aria-labelledby="recommended-questions-title" className="mt-8">
        <p
          className="font-mono text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
          id="recommended-questions-title"
        >
          Try a known signal
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {recommendedQuestions.map((recommendedQuestion) => (
            <button
              className="border border-slate-900/10 bg-white px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:border-[#6657dd]/35 hover:bg-[#f0efff] hover:text-[#4538a6] focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:outline-none"
              key={recommendedQuestion}
              onClick={() => chooseQuestion(recommendedQuestion)}
              type="button"
            >
              {recommendedQuestion}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
