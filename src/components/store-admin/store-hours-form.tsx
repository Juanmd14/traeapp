"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { updateStoreHoursAction } from "@/server/actions/stores";

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const hoursSchema = z.object({
  storeId: z.string().uuid(),
  hours: z.array(z.object({
    weekday: z.number().min(0).max(6),
    isOpen: z.boolean(),
    opensAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })),
});

type DayHours = {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
};

type Props = {
  storeId: string;
  initial: DayHours[];
};

export function StoreHoursForm({ storeId, initial }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { watch, setValue, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      storeId,
      hours: initial.map((h, i) => ({ weekday: i, ...h })),
    },
  });

  const hours = watch("hours");

  const onSubmit = async (data: typeof hours extends Array<infer T> ? { storeId: string, hours: T[] } : never) => {
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

  const toggleDay = (index: number) => {
    const newHours = [...hours] as typeof hours;
    newHours[index] = { ...newHours[index]!, isOpen: !newHours[index]!.isOpen };
    setValue("hours", newHours);
  };

  const updateTime = (index: number, field: "opensAt" | "closesAt", value: string) => {
    const newHours = [...hours] as typeof hours;
    newHours[index] = { ...newHours[index]!, [field]: value };
    setValue("hours", newHours);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
        {hours.map((day, index) => (
          <div
            key={index}
            className="p-3 sm:p-4 grid grid-cols-[auto_auto_1fr] sm:flex sm:items-center gap-x-3 gap-y-2 sm:gap-4"
          >
            <div className="sm:w-28 col-start-1">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{dayNames[index]}</span>
            </div>

            <Switch
              checked={day.isOpen}
              onCheckedChange={() => toggleDay(index)}
              className="flex-shrink-0 col-start-2 justify-self-end sm:justify-self-auto"
            />

            {day.isOpen ? (
              <div className="col-span-3 sm:col-auto flex items-center gap-2 sm:flex-1 flex-wrap">
                <input
                  type="time"
                  value={day.opensAt}
                  onChange={(e) => updateTime(index, "opensAt", e.target.value)}
                  className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 sm:px-3 py-1.5 text-sm min-w-0"
                />
                <span className="text-neutral-400 dark:text-neutral-500">a</span>
                <input
                  type="time"
                  value={day.closesAt}
                  onChange={(e) => updateTime(index, "closesAt", e.target.value)}
                  className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 sm:px-3 py-1.5 text-sm min-w-0"
                />
              </div>
            ) : (
              <span className="col-span-3 sm:col-auto text-neutral-400 dark:text-neutral-500 text-sm">Cerrado</span>
            )}
          </div>
        ))}
      </div>

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