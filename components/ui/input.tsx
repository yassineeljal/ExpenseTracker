import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-xl border px-3 py-2 text-sm bg-transparent outline-none focus-visible:ring-2",
      "border-[rgb(var(--border))] focus-visible:ring-black dark:focus-visible:ring-white",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
