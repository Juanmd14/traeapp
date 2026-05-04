"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { submitReviewAction } from "@/server/actions/reviews";

type Props = {
  orderId: string;
  storeId: string;
  driverId: string | null;
  onReviewed: () => void;
};

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
          aria-label={`${n} estrellas`}
        >
          <Star
            className={`size-8 transition-colors ${
              n <= (hovered || value)
                ? "fill-warning-400 text-warning-400"
                : "fill-neutral-200 text-neutral-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewModal({ orderId, storeId, driverId, onReviewed }: Props) {
  const [open, setOpen] = useState(true);
  const [storeRating, setStoreRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState("");

  const { execute, isPending } = useAction(submitReviewAction, {
    onSuccess: () => {
      toast.success("Gracias por tu calificación");
      setOpen(false);
      onReviewed();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "No se pudo enviar la calificación");
    },
  });

  const handleSubmit = () => {
    if (storeRating === 0) {
      toast.error("Calificá el comercio antes de continuar");
      return;
    }
    execute({
      orderId,
      storeId,
      storeRating,
      deliveryRating: driverId && deliveryRating > 0 ? deliveryRating : null,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calificá tu pedido</DialogTitle>
          <DialogDescription>
            Tu opinion ayuda a mejorar el servicio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-body-sm font-medium text-neutral-700 mb-2">
              Comercio
            </p>
            <StarPicker value={storeRating} onChange={setStoreRating} />
          </div>

          {driverId && (
            <div>
              <p className="text-body-sm font-medium text-neutral-700 mb-2">
                Repartidor
              </p>
              <StarPicker value={deliveryRating} onChange={setDeliveryRating} />
            </div>
          )}

          <div>
            <p className="text-body-sm font-medium text-neutral-700 mb-2">
              Comentario (opcional)
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="¿Cómo fue tu experiencia?"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending || storeRating === 0}
            className="w-full bg-primary text-white font-medium py-2.5 rounded-lg text-body-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Enviando..." : "Enviar calificación"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
