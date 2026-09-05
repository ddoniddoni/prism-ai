import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PromptInput } from "./prompt-input";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PromptInput", () => {
  it("focuses the question after choosing a suggestion", async () => {
    const user = userEvent.setup();
    render(<PromptInput recommendedQuestions={["지난달 매출을 보여줘."]} />);
    await user.click(
      screen.getByRole("button", { name: "지난달 매출을 보여줘." }),
    );
    expect(screen.getByRole("textbox", { name: "분석할 질문" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "분석할 질문" })).toHaveValue(
      "지난달 매출을 보여줘.",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("gives separate submissions different dashboard IDs", async () => {
    const user = userEvent.setup();
    render(<PromptInput recommendedQuestions={[]} />);
    await user.type(screen.getByRole("textbox"), "지난달 매출을 보여줘.");
    await user.click(screen.getByRole("button", { name: "분석 시작하기" }));
    await user.click(screen.getByRole("button", { name: "분석 시작하기" }));
    const first = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    const second = new URL(String(push.mock.calls[1]?.[0]), "http://localhost");
    expect(first.pathname).not.toBe(second.pathname);
    expect(first.pathname).not.toContain("mock-preview");
    expect(first.searchParams.get("question")).toBe("지난달 매출을 보여줘.");
  });

  it("submits with Enter while leaving Shift+Enter and IME composition alone", () => {
    render(<PromptInput recommendedQuestions={[]} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "모바일 매출" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(push).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledTimes(1);
  });
});
