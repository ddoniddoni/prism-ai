"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function WidgetCardHeightObserver({
  children,
  onContentHeightChange,
}: {
  children: ReactNode;
  onContentHeightChange: (contentHeight: number) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const observedContent = content;

    function synchronizeHeight() {
      onContentHeightChange(
        Math.ceil(observedContent.getBoundingClientRect().height),
      );
    }

    synchronizeHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(synchronizeHeight);

    observer.observe(observedContent);

    return () => observer.disconnect();
  }, [onContentHeightChange]);

  return <div ref={contentRef}>{children}</div>;
}
