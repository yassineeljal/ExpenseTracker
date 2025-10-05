import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800", className)}>
      <div className="h-full bg-black dark:bg-white" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
