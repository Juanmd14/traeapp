import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  variant?: "primary" | "accent" | "warning" | "dark";
  className?: string;
};

const variants = {
  primary: "bg-gradient-to-br from-primary-500 to-primary-700 text-white",
  accent: "bg-gradient-to-br from-accent-500 to-accent-700 text-white",
  warning: "bg-gradient-to-br from-warning-400 to-warning-600 text-warning-900",
  dark: "bg-gradient-to-br from-neutral-800 to-neutral-900 text-white",
};

export function PromoBanner({ title, subtitle, variant = "primary", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 sm:p-5 shadow-card",
        variants[variant],
        className,
      )}
    >
      {subtitle && (
        <p className="text-body-xs opacity-85 mb-1 font-medium">{subtitle}</p>
      )}
      <h3 className="text-heading-md sm:text-heading-lg font-bold leading-tight">
        {title}
      </h3>
    </div>
  );
}
