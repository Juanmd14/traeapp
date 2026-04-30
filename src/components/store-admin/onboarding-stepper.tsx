import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  label: string;
};

type Props = {
  steps: Step[];
  currentIndex: number;
};

export function OnboardingStepper({ steps, currentIndex }: Props) {
  return (
    <ol className="flex items-center w-full mb-8">
      {steps.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === steps.length - 1;

        return (
          <li
            key={step.id}
            className={cn(
              "flex items-center",
              !isLast && "w-full after:content-[''] after:w-full after:h-0.5 after:border-b after:mx-3",
              isComplete ? "after:border-primary-600" : "after:border-neutral-200",
            )}
          >
            <div className="flex flex-col items-center min-w-[80px]">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center transition",
                  isComplete && "bg-primary-600 text-white",
                  isCurrent && "bg-primary-100 text-primary-700 ring-2 ring-primary-600",
                  !isComplete && !isCurrent && "bg-neutral-100 text-neutral-400",
                )}
              >
                {isComplete ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <span className="text-body-sm font-medium">{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-body-xs mt-1.5 text-center",
                  isCurrent ? "font-medium text-neutral-900" : "text-neutral-500",
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
