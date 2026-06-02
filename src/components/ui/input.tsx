import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border bg-white dark:bg-neutral-800 px-3 py-2 text-body-md text-neutral-900 dark:text-neutral-100",
          "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-body-sm file:font-medium",
          invalid ? "border-destructive" : "border-neutral-300 dark:border-neutral-600",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
