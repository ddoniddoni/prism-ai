import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type NativeSelectProps = ComponentProps<"select"> & {
  density?: "default" | "compact";
};

export function NativeSelect({
  className,
  density = "default",
  ...props
}: NativeSelectProps) {
  return (
    <span className="relative inline-flex max-w-full min-w-0 items-center">
      <select
        {...props}
        className={cn(
          "peer w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-[#dde2e8] bg-white pr-9 pl-3 text-[13px] leading-normal font-medium text-[#424753] transition-colors hover:border-[#b4b8c4] focus-visible:border-[#4f46e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] disabled:cursor-not-allowed disabled:bg-[#f2f4f6] disabled:text-[#9296a0] forced-colors:appearance-auto",
          density === "compact" ? "h-9 text-[12px]" : "h-11",
          className,
        )}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 size-4 text-[#777587] peer-disabled:opacity-40 forced-colors:hidden"
        strokeWidth={1.75}
      />
    </span>
  );
}
