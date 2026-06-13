"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateStoreHoursAction } from "@/server/actions/stores";
import { cn } from "@/lib/utils";

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type TimeRange = {
  opensAt: string;
  closesAt: string;
};

type DayHours = {
  isOpen: boolean;
  ranges: TimeRange[];
};

type Props = {
  storeId: string;
  initial: DayHours[];
};

const DEFAULT_RANGE: TimeRange = { opensAt: "09:00", closesAt: "22:00" };

export function StoreHoursForm({ storeId, initial }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      storeId,
      hours: initial.map((h, i) => ({
        weekday: i,
        isOpen: h.isOpen,
        ranges: h.ranges.length > 0 ? h.ranges : [{ ...DEFAULT_RANGE }],
      })),
    },
  });

  const hours = watch("hours");

  const onSubmit = async (data: { storeId: string; hours: typeof hours }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateStoreHoursAction({
        storeId,
        hours: data.hours,
      });
      if (result?.serverError) {
        setError(result.serverError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const setDayOpen = (index: number, open: boolean) => {
    const newHours = [...hours];
    const day = newHours[index]!;
    newHours[index] = {
      ...day,
      isOpen: open,
      // Al abrir un día sin tramos, dejamos uno por defecto para editar.
      ranges: day.ranges.length > 0 ? day.ranges : [{ ...DEFAULT_RANGE }],
    };
    setValue("hours", newHours);
  };

  const updateTime = (
    dayIndex: number,
    rangeIndex: number,
    field: "opensAt" | "closesAt",
    value: string,
  ) => {
    const newHours = [...hours];
    const day = newHours[dayIndex]!;
    const ranges = day.ranges.map((r, i) =>
      i === rangeIndex ? { ...r, [field]: value } : r,
    );
    newHours[dayIndex] = { ...day, ranges };
    setValue("hours", newHours);
  };

  const addRange = (dayIndex: number) => {
    const newHours = [...hours];
    const day = newHours[dayIndex]!;
    // El tramo nuevo arranca donde cerró el anterior, para encadenar rápido.
    const last = day.ranges[day.ranges.length - 1];
    const next: TimeRange = last
      ? { opensAt: last.closesAt, closesAt: "22:00" }
      : { ...DEFAULT_RANGE };
    newHours[dayIndex] = { ...day, ranges: [...day.ranges, next] };
    setValue("hours", newHours);
  };

  const removeRange = (dayIndex: number, rangeIndex: number) => {
    const newHours = [...hours];
    const day = newHours[dayIndex]!;
    const ranges = day.ranges.filter((_, i) => i !== rangeIndex);
    newHours[dayIndex] = {
      ...day,
      ranges: ranges.length > 0 ? ranges : [{ ...DEFAULT_RANGE }],
    };
    setValue("hours", newHours);
  };

  // Copia los tramos de un día (y su estado abierto) a toda la semana.
  const applyToAll = (index: number) => {
    const source = hours[index]!;
    const newHours = hours.map((h) => ({
      ...h,
      isOpen: source.isOpen,
      ranges: source.ranges.map((r) => ({ ...r })),
    }));
    setValue("hours", newHours);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
        {hours.map((day, index) => (
          <div
            key={index}
            className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
          >
            <div className="sm:w-24 shrink-0 sm:pt-1.5">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{dayNames[index]}</span>
            </div>

            {/* Botón claro Abierto / Cerrado */}
            <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden shrink-0 self-start">
              <button
                type="button"
                onClick={() => setDayOpen(index, true)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium transition",
                  day.isOpen
                    ? "bg-accent-600 text-white"
                    : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                )}
              >
                Abierto
              </button>
              <button
                type="button"
                onClick={() => setDayOpen(index, false)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium transition border-l border-neutral-200 dark:border-neutral-700",
                  !day.isOpen
                    ? "bg-neutral-800 dark:bg-neutral-700 text-white"
                    : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                )}
              >
                Cerrado
              </button>
            </div>

            {day.isOpen ? (
              <div className="flex-1 space-y-2 min-w-0">
                {day.ranges.map((range, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2 flex-wrap">
                    <input
                      type="time"
                      value={range.opensAt}
                      onChange={(e) => updateTime(index, rIdx, "opensAt", e.target.value)}
                      className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 sm:px-3 py-1.5 text-sm min-w-0"
                    />
                    <span className="text-neutral-400 dark:text-neutral-500">a</span>
                    <input
                      type="time"
                      value={range.closesAt}
                      onChange={(e) => updateTime(index, rIdx, "closesAt", e.target.value)}
                      className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 sm:px-3 py-1.5 text-sm min-w-0"
                    />
                    {day.ranges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRange(index, rIdx)}
                        className="size-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Quitar tramo"
                        aria-label="Quitar tramo"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-3 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => addRange(index)}
                    className="inline-flex items-center gap-1 text-body-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    title="Agregar otro tramo (ej: si cortás al mediodía)"
                  >
                    <Plus className="size-3.5" />
                    Agregar tramo
                  </button>
                  <button
                    type="button"
                    onClick={() => applyToAll(index)}
                    className="inline-flex items-center gap-1 text-body-xs text-neutral-500 dark:text-neutral-400 hover:text-primary-600 hover:underline"
                    title="Usar este mismo horario para toda la semana"
                  >
                    <Copy className="size-3.5" />
                    Aplicar a todos
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-neutral-400 dark:text-neutral-500 text-sm sm:pt-1.5">Sin atención este día</span>
            )}
          </div>
        ))}
      </div>

      <p className="text-body-xs text-neutral-500 dark:text-neutral-400">
        ¿Cerrás al mediodía? Agregá un segundo tramo (ej: 08:00 a 13:00 y 14:00 a 17:00).
      </p>

      {error && (
        <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading}>
        Guardar horarios
      </Button>
    </form>
  );
}
