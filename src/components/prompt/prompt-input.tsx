"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { ArrowUpRight, DatabaseZap } from "lucide-react";

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
  const questionInputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    const normalizedQuestion = question.trim();

    if (normalizedQuestion.length < MINIMUM_QUESTION_LENGTH) {
      setError("분석할 질문을 두 글자 이상 입력해 주세요.");
      questionInputRef.current?.focus();
      return;
    }

    if (normalizedQuestion.length > MAXIMUM_QUESTION_LENGTH) {
      setError("질문은 300자 이내로 입력해 주세요.");
      questionInputRef.current?.focus();
      return;
    }

    setError(null);
    const dashboardId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) =>
            value.toString(16).padStart(8, "0"),
          ).join("");
    startTransition(() => {
      router.push(
        `/dashboard/${dashboardId}?question=${encodeURIComponent(normalizedQuestion)}`,
      );
    });
  }

  function chooseQuestion(nextQuestion: string) {
    setQuestion(nextQuestion);
    setError(null);
    questionInputRef.current?.focus();
  }

  return (
    <div>
      <form aria-busy={isPending} onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="analysis-question">
          분석할 질문
        </label>
        <p className="sr-only" id="prompt-description">
          자연어 질문을 허용된 분석 계획과 데이터 근거가 있는 대시보드로
          연결합니다.
        </p>
        <div className="flex min-h-[72px] items-center gap-3 rounded-xl border border-[#dde2e8] bg-white px-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-[border-color,box-shadow] duration-100 focus-within:border-[#4f46e5] focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.1)]">
          <DatabaseZap
            aria-hidden="true"
            className="size-5 shrink-0 text-[#777587]"
          />
          <textarea
            autoComplete="off"
            aria-describedby={
              error
                ? "prompt-description prompt-keyboard-hint question-error"
                : "prompt-description prompt-keyboard-hint"
            }
            aria-invalid={Boolean(error)}
            className="max-h-32 min-h-[70px] w-full resize-none bg-transparent py-5 text-[15px] leading-7 text-[#191c1e] outline-none placeholder:text-[#9296a0]"
            disabled={isPending}
            enterKeyHint="send"
            id="analysis-question"
            maxLength={MAXIMUM_QUESTION_LENGTH}
            name="question"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key !== "Enter" ||
                event.shiftKey ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              )
                return;
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }}
            placeholder="예: 지난달 매출이 감소한 이유를 분석해줘…"
            ref={questionInputRef}
            value={question}
          />
          <button
            aria-label={isPending ? "분석 화면을 여는 중" : "분석 시작하기"}
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#4f46e5] text-white transition-colors duration-100 hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] disabled:cursor-wait disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            <ArrowUpRight aria-hidden="true" className="size-[18px]" />
          </button>
        </div>
        <p aria-live="polite" className="sr-only" role="status">
          {isPending ? "대시보드 셸을 여는 중" : ""}
        </p>
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

      <p
        className="mt-2 text-right text-[11px] text-[#777587]"
        id="prompt-keyboard-hint"
      >
        엔터로 분석 · 시프트+엔터로 줄바꿈
      </p>

      <section aria-labelledby="recommended-questions-title" className="mt-4">
        <p className="sr-only" id="recommended-questions-title">
          추천 분석 질문
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {recommendedQuestions.map((recommendedQuestion) => (
            <button
              className="min-h-11 rounded border border-[#dde2e8] bg-white px-3 py-1.5 text-left text-[12px] text-[#595e6b] transition-colors duration-100 hover:border-[#c3c0ff] hover:bg-[#f2f4f6] hover:text-[#3525cd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
              disabled={isPending}
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
