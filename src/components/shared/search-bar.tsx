"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [focused, setFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce: buscar automáticamente 400ms después de dejar de escribir
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        startTransition(() => {
          router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
        });
      }, 400);
    } else if (query.length === 0) {
      // Si borran todo, volver a /buscar sin query
      if (searchParams.get("q")) {
        startTransition(() => {
          router.push("/buscar");
        });
      }
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      startTransition(() => {
        router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
      });
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all",
          focused
            ? "bg-white ring-2 ring-primary-500 ring-offset-0"
            : "bg-neutral-100 hover:bg-neutral-200/70",
        )}
      >
        {isPending ? (
          <Loader2 className="size-4 text-primary-500 shrink-0 animate-spin" />
        ) : (
          <Search
            className={cn(
              "size-4 shrink-0 transition",
              focused ? "text-primary-500" : "text-neutral-400",
            )}
          />
        )}

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Buscá comercios o productos..."
          className="flex-1 bg-transparent text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none min-w-0"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="size-5 rounded-full bg-neutral-300 hover:bg-neutral-400 flex items-center justify-center transition shrink-0"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3 text-neutral-600" />
          </button>
        )}
      </div>
    </form>
  );
}
