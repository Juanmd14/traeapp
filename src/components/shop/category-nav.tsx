"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export function CategoryNav({ categories }: { categories: Category[] }) {
  const [headerH, setHeaderH] = useState(64);
  const [active, setActive] = useState<string | null>(categories[0]?.id ?? null);
  const navRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Medir la altura del header sticky (variable en mobile/desktop)
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = () => setHeaderH(header.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  // Resaltar la categoría visible debajo de las barras
  useEffect(() => {
    if (categories.length === 0) return;
    const navH = navRef.current?.getBoundingClientRect().height ?? 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id.replace("cat-", ""));
        }
      },
      { rootMargin: `-${Math.round(headerH + navH) + 4}px 0px -55% 0px`, threshold: 0 }
    );
    categories.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories, headerH]);

  // Centrar el chip activo en el scroller horizontal
  useEffect(() => {
    if (!active) return;
    chipRefs.current[active]?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [active]);

  const handleClick = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const navH = navRef.current?.getBoundingClientRect().height ?? 0;
    const y = el.getBoundingClientRect().top + window.scrollY - (headerH + navH) + 2;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActive(id);
  };

  if (categories.length < 2) return null;

  return (
    <div
      ref={navRef}
      style={{ top: headerH }}
      className="sticky z-30 -mx-4 px-4 py-2.5 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800"
    >
      <div className="scroll-snap-x !pb-0">
        {categories.map((c) => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              ref={(el) => { chipRefs.current[c.id] = el; }}
              onClick={() => handleClick(c.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-body-sm font-medium whitespace-nowrap transition",
                isActive
                  ? "bg-primary-600 text-white"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
              )}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
