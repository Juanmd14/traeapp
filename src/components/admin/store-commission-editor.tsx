"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { updateStoreCommissionAction } from "@/server/actions/stores";

type Props = {
  storeId: string;
  initial: number;
};

export function StoreCommissionEditor({ storeId, initial }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onSave = () => {
    setError(null);
    setFeedback(null);
    if (Number.isNaN(value) || value < 0 || value > 30) {
      setError("Ingresá un valor entre 0 y 30");
      return;
    }
    start(async () => {
      const result = await updateStoreCommissionAction({ storeId, commissionPct: value });
      if (result?.serverError) {
        setError(result.serverError);
        return;
      }
      setFeedback("Comisión actualizada.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <FormField
        label="Comisión de Trae (%)"
        htmlFor={`commission-${storeId}`}
        hint="Porcentaje que retiene la plataforma por cada venta con Mercado Pago. Máximo 30%."
      >
        <Input
          id={`commission-${storeId}`}
          type="number"
          min="0"
          max="30"
          step="0.5"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => setValue(e.target.valueAsNumber)}
          className="max-w-[140px]"
        />
      </FormField>

      {error && (
        <p className="text-body-xs text-destructive bg-red-50 px-3 py-2 rounded-md">{error}</p>
      )}
      {feedback && (
        <p className="text-body-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md">{feedback}</p>
      )}

      <Button onClick={onSave} loading={pending} disabled={value === initial}>
        Guardar comisión
      </Button>
    </div>
  );
}
