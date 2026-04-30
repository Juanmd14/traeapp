import Link from "next/link";
import { cn } from "@/lib/utils";

export type Category = {
  slug: string;
  name: string;
  emoji: string;
  bgClass: string; // ej: "bg-primary-100"
};

export function CategoryPill({ category }: { category: Category }) {
  return (
    <Link
      href={`/c/${category.slug}`}
      className="flex flex-col items-center gap-1.5 min-w-[72px]"
    >
      <div
        className={cn(
          "size-14 rounded-full flex items-center justify-center text-2xl transition",
          "hover:scale-105 active:scale-95",
          category.bgClass,
        )}
      >
        {category.emoji}
      </div>
      <span className="text-body-xs font-medium text-neutral-700 text-center">
        {category.name}
      </span>
    </Link>
  );
}
