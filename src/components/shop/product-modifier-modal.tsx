"use client";

import { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export type ModifierOption = {
  id: string;
  name: string;
  price_delta: number;
  sort_order: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  is_required: boolean;
  max_select: number; // 1 = single, >1 = multiple
  sort_order: number;
  product_modifier_options: ModifierOption[];
};

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
  modifiers: ModifierGroup[];
  onConfirm: (
    selectedModifiers: Array<{ optionId: string; name: string; priceDelta: number }>,
    quantity: number
  ) => void;
  onClose: () => void;
};

export function ProductModifierModal({ product, modifiers, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  const toggleOption = (group: ModifierGroup, optionId: string) => {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      if (group.max_select === 1) {
        return { ...prev, [group.id]: [optionId] };
      }
      const already = current.includes(optionId);
      return {
        ...prev,
        [group.id]: already ? current.filter((id) => id !== optionId) : [...current, optionId],
      };
    });
  };

  const isSelected = (groupId: string, optionId: string) =>
    (selected[groupId] ?? []).includes(optionId);

  const allRequiredFilled = modifiers
    .filter((g) => g.is_required)
    .every((g) => (selected[g.id] ?? []).length > 0);

  const extraTotal = modifiers.flatMap((g) =>
    g.product_modifier_options.filter((o) => isSelected(g.id, o.id))
  ).reduce((acc, o) => acc + Number(o.price_delta), 0);

  const unitPrice = product.price + extraTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const selectedModifiers = modifiers.flatMap((g) =>
      g.product_modifier_options
        .filter((o) => isSelected(g.id, o.id))
        .map((o) => ({ optionId: o.id, name: o.name, priceDelta: Number(o.price_delta) }))
    );
    onConfirm(selectedModifiers, quantity);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-heading-md font-semibold text-neutral-900">{product.name}</h3>
            <p className="text-body-sm text-neutral-500 mt-0.5">{formatPrice(product.price)} base</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modifier groups */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {modifiers.map((group) => {
            const sortedOptions = [...group.product_modifier_options].sort((a, b) => a.sort_order - b.sort_order);
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-body-md font-semibold text-neutral-900">{group.name}</p>
                  {group.is_required && (
                    <span className="text-[10px] font-bold uppercase bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                      Obligatorio
                    </span>
                  )}
                  {group.max_select !== 1 && (
                    <span className="text-[10px] text-neutral-400">Varios</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {sortedOptions.map((option) => {
                    const active = isSelected(group.id, option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleOption(group, option.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-2 transition ${
                          active
                            ? "border-primary-500 bg-primary-50"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`size-4 rounded-full border-2 flex items-center justify-center transition ${
                            active ? "border-primary-500 bg-primary-500" : "border-neutral-300"
                          }`}>
                            {active && <div className="size-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-body-md text-neutral-900">{option.name}</span>
                        </div>
                        {Number(option.price_delta) > 0 && (
                          <span className="text-body-sm text-neutral-500">
                            + {formatPrice(Number(option.price_delta))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — quantity + confirm */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-body-sm text-neutral-500">Cantidad</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="size-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="text-body-md font-semibold w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="size-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!allRequiredFilled}
            className="w-full bg-primary-600 text-white font-semibold py-3 rounded-xl text-body-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-between px-4"
          >
            <span>Agregar al carrito</span>
            <span>{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
