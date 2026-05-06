"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  /** Modificadores opcionales seleccionados */
  modifiers?: Array<{ optionId: string; name: string; priceDelta: number; isAbsolute?: boolean }>;
  notes?: string;
  /** Para identificar variantes con distintos modificadores */
  lineId: string;
};

export type CartStore = {
  storeId: string | null;
  storeName: string | null;
  storeSlug: string | null;
  deliveryFee: number;
  minOrderAmount: number;
  items: CartItem[];

  /** Agrega item; si es de otro comercio, pregunta confirmación. */
  add: (params: {
    storeId: string;
    storeName: string;
    storeSlug: string;
    deliveryFee: number;
    minOrderAmount: number;
    item: Omit<CartItem, "lineId">;
  }) => "added" | "different-store";

  /** Confirma reemplazar carrito por otro comercio */
  replaceWithStore: (params: {
    storeId: string;
    storeName: string;
    storeSlug: string;
    deliveryFee: number;
    minOrderAmount: number;
    item: Omit<CartItem, "lineId">;
  }) => void;

  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  remove: (lineId: string) => void;
  clear: () => void;

  /** Selectores derivados */
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  meetsMinimum: () => boolean;
};

const buildLineId = (productId: string, modifiers?: CartItem["modifiers"]) => {
  if (!modifiers || modifiers.length === 0) return `${productId}::base`;
  const sig = modifiers.map((m) => m.optionId).sort().join("-");
  return `${productId}::${sig}`;
};

const lineTotal = (item: CartItem): number => {
  const mods = item.modifiers ?? [];
  const absoluteMods = mods.filter((m) => m.isAbsolute);
  const deltaMods = mods.filter((m) => !m.isAbsolute);
  const deltaTotal = deltaMods.reduce((acc, m) => acc + Number(m.priceDelta), 0);
  const unitPrice = absoluteMods.length > 0
    ? absoluteMods.reduce((acc, m) => acc + Number(m.priceDelta), 0) + deltaTotal
    : Number(item.unitPrice) + deltaTotal;
  return unitPrice * item.quantity;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      storeId: null,
      storeName: null,
      storeSlug: null,
      deliveryFee: 0,
      minOrderAmount: 0,
      items: [],

      add: (params) => {
        const state = get();
        if (state.storeId && state.storeId !== params.storeId && state.items.length > 0) {
          return "different-store";
        }
        const lineId = buildLineId(params.item.productId, params.item.modifiers);
        const existing = state.items.find((it) => it.lineId === lineId);

        const newItems = existing
          ? state.items.map((it) =>
              it.lineId === lineId
                ? { ...it, quantity: it.quantity + params.item.quantity }
                : it,
            )
          : [...state.items, { ...params.item, lineId }];

        set({
          storeId: params.storeId,
          storeName: params.storeName,
          storeSlug: params.storeSlug,
          deliveryFee: params.deliveryFee,
          minOrderAmount: params.minOrderAmount,
          items: newItems,
        });
        return "added";
      },

      replaceWithStore: (params) => {
        const lineId = buildLineId(params.item.productId, params.item.modifiers);
        set({
          storeId: params.storeId,
          storeName: params.storeName,
          storeSlug: params.storeSlug,
          deliveryFee: params.deliveryFee,
          minOrderAmount: params.minOrderAmount,
          items: [{ ...params.item, lineId }],
        });
      },

      increment: (lineId) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.lineId === lineId ? { ...it, quantity: it.quantity + 1 } : it,
          ),
        })),

      decrement: (lineId) =>
        set((state) => ({
          items: state.items
            .map((it) =>
              it.lineId === lineId ? { ...it, quantity: it.quantity - 1 } : it,
            )
            .filter((it) => it.quantity > 0),
        })),

      remove: (lineId) =>
        set((state) => ({
          items: state.items.filter((it) => it.lineId !== lineId),
        })),

      clear: () =>
        set({
          storeId: null,
          storeName: null,
          storeSlug: null,
          deliveryFee: 0,
          minOrderAmount: 0,
          items: [],
        }),

      getSubtotal: () =>
        get().items.reduce((acc, it) => acc + lineTotal(it), 0),

      getTotal: () => {
        const state = get();
        return state.getSubtotal() + Number(state.deliveryFee);
      },

      getItemCount: () =>
        get().items.reduce((acc, it) => acc + it.quantity, 0),

      meetsMinimum: () => {
        const state = get();
        return state.getSubtotal() >= Number(state.minOrderAmount || 0);
      },
    }),
    {
      name: "delivery-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        storeId: state.storeId,
        storeName: state.storeName,
        storeSlug: state.storeSlug,
        deliveryFee: state.deliveryFee,
        minOrderAmount: state.minOrderAmount,
        items: state.items,
      }),
    },
  ),
);
