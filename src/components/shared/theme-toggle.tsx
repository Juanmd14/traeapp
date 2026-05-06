"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="size-8 rounded-lg" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="size-8 rounded-lg flex items-center justify-center
        bg-transparent
        text-neutral-500 dark:text-neutral-400
        hover:text-neutral-800 dark:hover:text-neutral-100
        hover:bg-neutral-100 dark:hover:bg-neutral-800
        transition-all duration-200"
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400" />
      ) : (
        <Moon className="size-4 text-indigo-500" />
      )}
    </button>
  );
}
