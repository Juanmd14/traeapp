"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-7 w-[88px] rounded-full" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
        bg-white dark:bg-neutral-800
        border border-neutral-200 dark:border-neutral-700
        shadow-md
        text-neutral-500 dark:text-neutral-400
        hover:text-neutral-800 dark:hover:text-neutral-100
        hover:border-neutral-300 dark:hover:border-neutral-500
        transition-all duration-200 text-xs font-medium"
    >
      {isDark ? (
        <Sun className="size-3.5 text-amber-400 shrink-0" />
      ) : (
        <Moon className="size-3.5 text-indigo-500 shrink-0" />
      )}
      <span>{isDark ? "Claro" : "Oscuro"}</span>
    </button>
  );
}
