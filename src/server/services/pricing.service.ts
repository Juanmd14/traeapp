import "server-only";

export type PricingItem = {
  productId: string;
  unitPrice: number;
  quantity: number;
  modifiersTotal?: number;
};

export type PricingPromo = {
  id: string;
  type: "percent" | "amount" | "free_delivery" | "bxgy";
  value: number | null;
  minOrderAmount: number | null;
};

export type PricingResult = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  commissionAmount: number;
};

/**
 * Calcula el total final de un pedido aplicando promociones y comisión.
 * Es la fuente única de verdad de precios — el cliente nunca decide el total.
 */
export function calculatePricing(params: {
  items: PricingItem[];
  storeDeliveryFee: number;
  storeMinOrderAmount: number;
  storeCommissionPct: number;
  promo?: PricingPromo | null;
}): PricingResult & { error?: string } {
  const subtotal = params.items.reduce((acc, it) => {
    const lineUnit = Number(it.unitPrice) + Number(it.modifiersTotal ?? 0);
    return acc + lineUnit * it.quantity;
  }, 0);

  if (subtotal < params.storeMinOrderAmount) {
    return {
      subtotal,
      deliveryFee: Number(params.storeDeliveryFee),
      discount: 0,
      total: 0,
      commissionAmount: 0,
      error: `El subtotal no alcanza el mínimo de $${params.storeMinOrderAmount}`,
    };
  }

  let deliveryFee = Number(params.storeDeliveryFee);
  let discount = 0;

  if (params.promo) {
    const p = params.promo;
    if (p.minOrderAmount && subtotal < p.minOrderAmount) {
      // promo no aplica → ignorar
    } else {
      switch (p.type) {
        case "percent":
          discount = Math.round((subtotal * Number(p.value ?? 0)) / 100);
          break;
        case "amount":
          discount = Math.min(subtotal, Number(p.value ?? 0));
          break;
        case "free_delivery":
          deliveryFee = 0;
          break;
        case "bxgy":
          // Reservado para futuro (buy X get Y)
          break;
      }
    }
  }

  const total = Math.max(0, subtotal - discount + deliveryFee);

  // Comisión sobre subtotal (no sobre envío) — práctica habitual
  const commissionAmount = Math.round(
    (subtotal * Number(params.storeCommissionPct)) / 100,
  );

  return {
    subtotal,
    deliveryFee,
    discount,
    total,
    commissionAmount,
  };
}
