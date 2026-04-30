"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { publishStoreAction } from "@/server/actions/stores";

type Props = {
  storeId: string;
  storeName: string;
  productCount: number;
  address: string;
};

export function OnboardingPublishForm({ storeId, storeName, productCount, address }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [published, setPublished] = useState(false);

  const onPublish = () => {
    setServerError(null);
    startTransition(async () => {
      const result = await publishStoreAction({ storeId });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setPublished(true);
      setTimeout(() => router.push("/comercio/pedidos"), 2000);
    });
  };

  if (published) {
    return (
      <div className="text-center py-8">
        <div className="size-16 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="size-8" />
        </div>
        <h2 className="text-heading-xl font-semibold text-neutral-900 mb-2">
          ¡{storeName} está en revisión!
        </h2>
        <p className="text-body-md text-neutral-500 mb-6">
          En las próximas horas vamos a activarlo en el marketplace.
          <br />
          Mientras tanto, ya podés gestionar pedidos desde el panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-3">
        <div>
          <p className="text-body-xs text-neutral-500 uppercase tracking-wider">Comercio</p>
          <p className="text-heading-md font-semibold text-neutral-900">{storeName}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-200">
          <div>
            <p className="text-body-xs text-neutral-500">Dirección</p>
            <p className="text-body-sm text-neutral-900 truncate">{address || "Sin definir"}</p>
          </div>
          <div>
            <p className="text-body-xs text-neutral-500">Productos cargados</p>
            <p className="text-body-sm text-neutral-900">
              {productCount} {productCount === 1 ? "producto" : "productos"}
            </p>
          </div>
        </div>
      </div>

      {/* Que va a pasar */}
      <div className="space-y-3">
        <h3 className="text-heading-sm font-semibold text-neutral-900">
          ¿Qué pasa al publicar?
        </h3>
        <ul className="space-y-2.5">
          <li className="flex gap-3">
            <CheckCircle2 className="size-5 text-accent-600 shrink-0 mt-0.5" />
            <span className="text-body-md text-neutral-700">
              Tu comercio queda <strong className="font-medium text-neutral-900">en revisión</strong> por nuestro equipo (1-24hs).
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="size-5 text-accent-600 shrink-0 mt-0.5" />
            <span className="text-body-md text-neutral-700">
              Una vez aprobado, aparece en el marketplace y empieza a recibir pedidos.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="size-5 text-accent-600 shrink-0 mt-0.5" />
            <span className="text-body-md text-neutral-700">
              Podés modificar productos, precios y horarios cuando quieras desde el panel.
            </span>
          </li>
        </ul>
      </div>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <div className="flex justify-between pt-4 border-t border-neutral-200">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Volver
        </Button>
        <Button type="button" size="lg" onClick={onPublish} loading={isPending}>
          <Sparkles className="size-4" />
          Publicar comercio
        </Button>
      </div>
    </div>
  );
}
