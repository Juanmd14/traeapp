import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { cn, formatDeliveryTime, formatPrice } from "@/lib/utils";

export type StoreCardData = {
  slug: string;
  name: string;
  category: string;
  coverUrl?: string | null;
  rating: number;
  ratingCount?: number;
  deliveryMinMin: number;
  deliveryMaxMin: number;
  deliveryFee: number;
  promoBadge?: string;
  isOpen: boolean;
};

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <Link
      href={`/s/${store.slug}`}
      className={cn(
        "block bg-white rounded-xl overflow-hidden shadow-card transition",
        "hover:shadow-elevated active:scale-[0.99]",
        !store.isOpen && "opacity-60",
      )}
    >
      <div className="relative h-32 bg-neutral-100">
        {store.coverUrl ? (
          <Image
            src={store.coverUrl}
            alt={store.name}
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-300 to-primary-500" />
        )}

        <div className="absolute top-2 left-2 flex items-center gap-1 bg-neutral-900/85 text-white text-body-xs font-medium px-2 py-0.5 rounded-full backdrop-blur">
          <Star className="size-3 fill-current" />
          {store.rating.toFixed(1)}
        </div>

        {store.promoBadge && (
          <div className="absolute top-2 right-2 bg-warning-100 text-warning-800 text-body-xs font-semibold px-2 py-0.5 rounded-full">
            {store.promoBadge}
          </div>
        )}

        {!store.isOpen && (
          <div className="absolute inset-0 bg-neutral-900/40 flex items-center justify-center">
            <span className="bg-white text-neutral-900 text-body-sm font-medium px-3 py-1 rounded-full">
              Cerrado
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-heading-sm text-neutral-900 truncate">
          {store.name}
        </h3>
        <p className="text-body-sm text-neutral-500 mb-2 truncate">
          {store.category}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className="bg-neutral-100 text-neutral-700 text-body-xs font-medium px-2 py-0.5 rounded-full">
            {formatDeliveryTime(store.deliveryMinMin, store.deliveryMaxMin)}
          </span>
          {store.deliveryFee === 0 ? (
            <span className="bg-accent-100 text-accent-800 text-body-xs font-medium px-2 py-0.5 rounded-full">
              Envío gratis
            </span>
          ) : (
            <span className="bg-neutral-100 text-neutral-700 text-body-xs font-medium px-2 py-0.5 rounded-full">
              Envío {formatPrice(store.deliveryFee)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
