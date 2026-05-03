"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-md font-medium",
    "transition-all duration-200 ease-out",
    "hover:scale-[1.02] active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-sm hover:shadow-primary hover:-translate-y-0.5",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 hover:-translate-y-0.5",
        outline: "border border-primary-600 bg-white text-primary-600 hover:bg-primary-50 hover:-translate-y-0.5",
        dark: "bg-neutral-900 text-white hover:bg-neutral-800 hover:-translate-y-0.5",
        success: "bg-accent-600 text-white hover:bg-accent-700 shadow-[0_8px_24px_rgba(34,197,94,0.25)] hover:shadow-[0_12px_32px_rgba(34,197,94,0.35)] hover:-translate-y-0.5",
        ghost: "text-neutral-700 hover:bg-neutral-100 hover:-translate-y-0.5",
        destructive: "bg-destructive text-white hover:bg-destructive/90 hover:-translate-y-0.5",
        link: "text-primary-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-body-sm",
        lg: "h-12 px-6 text-body-lg",
        xl: "h-14 px-8 text-body-lg",
        icon: "h-11 w-11",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
