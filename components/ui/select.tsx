import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm bg-transparent outline-none focus-visible:ring-2",
        "border-[rgb(var(--border))] focus-visible:ring-black dark:focus-visible:ring-white",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
