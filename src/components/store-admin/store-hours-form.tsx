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
      <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-200">
        {hours.map((day, index) => (
          <div key={index} className="p-4 flex items-center gap-4">
            <div className="w-28">
              <span className="font-medium text-neutral-900">{dayNames[index]}</span>
            </div>

            <Switch
              checked={day.isOpen}
              onCheckedChange={() => toggleDay(index)}
              className="flex-shrink-0"
            />

            {day.isOpen ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={day.opensAt}
                  onChange={(e) => updateTime(index, "opensAt", e.target.value)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                />
                <span className="text-neutral-400">a</span>
                <input
                  type="time"
                  value={day.closesAt}
                  onChange={(e) => updateTime(index, "closesAt", e.target.value)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                />
              </div>
            ) : (
              <span className="text-neutral-400 text-sm">Cerrado</span>
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