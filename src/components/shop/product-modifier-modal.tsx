"use client";

import { useState } from "react";
import { X, Plus, Minus, Check, MinusCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export type QuantityOption = {
  id: string;
  quantity: number;
  price: number;
  is_default: boolean;
  sort_order: number;
  is_best_deal: boolean;
};

export type ModifierOption = {
  id: string;
  name: string;
  price_delta: number;
  is_absolute_price: boolean;
  sort_order: number;
  is_removal: boolean;
};

export type ModifierGroup = {
  id: string;
  name: string;
  is_required: boolean;
  max_select: number;
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
  quantityOptions?: QuantityOption[];
  hideManualQuantity?: boolean;
  onConfirm: (
    selectedModifiers: Array<{ optionId: string; name: string; priceDelta: number; isAbsolute: boolean; isRemoval: boolean }>,
    quantity: number,
    unitPrice: number
  ) => void;
  onClose: () => void;
};

export function ProductModifierModal({ 
  product, 
  modifiers, 
  quantityOptions = [],
  hideManualQuantity = false,
  onConfirm, 
  onClose 
}: Props) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedQuantityOption, setSelectedQuantityOption] = useState<string | null>(
    quantityOptions.find(q => q.is_default)?.id ?? null
  );

  const hasModifiers = modifiers.length > 0;
  const hasQuantityOptions = quantityOptions.length > 0;
  const showManualQuantity = !hideManualQuantity && !hasQuantityOptions;

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

  const selectedOptions = modifiers.flatMap((g) =>
    g.product_modifier_options.filter((o) => isSelected(g.id, o.id))
  );

  const addModifiers = selectedOptions.filter(o => !o.is_removal);
  const removeModifiers = selectedOptions.filter(o => o.is_removal);

  const absoluteOptions = selectedOptions.filter((o) => o.is_absolute_price);
  const deltaOptions = selectedOptions.filter((o) => !o.is_absolute_price);
  const deltaTotal = deltaOptions.reduce((acc, o) => acc + Number(o.price_delta), 0);
  
  const baseUnitPrice = product.price;
  const modifierTotal = absoluteOptions.length > 0
    ? absoluteOptions.reduce((acc, o) => acc + Number(o.price_delta), 0) + deltaTotal
    : deltaTotal;

  const selectedQtyOption = quantityOptions.find(q => q.id === selectedQuantityOption);
  const unitPrice = selectedQtyOption 
    ? Number(selectedQtyOption.price) 
    : baseUnitPrice + modifierTotal;
  
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const selectedModifiers = modifiers.flatMap((g) =>
      g.product_modifier_options
        .filter((o) => isSelected(g.id, o.id))
        .map((o) => ({ 
          optionId: o.id, 
          name: o.name, 
          priceDelta: Number(o.price_delta), 
          isAbsolute: o.is_absolute_price,
          isRemoval: o.is_removal 
        }))
    );
    onConfirm(selectedModifiers, quantity, unitPrice);
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
        <div className="flex items-start justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</h3>
            <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {hasQuantityOptions 
                ? `Desde ${formatPrice(Math.min(...quantityOptions.map(q => Number(q.price))))}`
                : `${formatPrice(baseUnitPrice)} base`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {hasModifiers && (
            <>
              {modifiers.some(g => g.product_modifier_options.some(o => !o.is_removal)) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-body-md font-semibold text-neutral-900">AGREGAR</p>
                  </div>
                  <div className="space-y-2">
                    {modifiers.flatMap(g => g.product_modifier_options.filter(o => !o.is_removal))
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((option) => {
                      const group = modifiers.find(g => g.product_modifier_options.some(o => o.id === option.id));
                      const isActive = group ? isSelected(group.id, option.id) : false;
                      
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => group && toggleOption(group, option.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${
                            isActive
                              ? "border-primary-500 bg-primary-50"
                              : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`size-5 rounded-full border-2 flex items-center justify-center transition ${
                              isActive ? "border-primary-500 bg-primary-500" : "border-neutral-300"
                            }`}>
                              {isActive && <Check className="size-3 text-white" />}
                            </div>
                            <span className="text-body-md text-neutral-900 dark:text-neutral-100">{option.name}</span>
                          </div>
                          {Number(option.price_delta) > 0 && (
                            <span className="text-body-sm font-medium text-primary-600">
                              {option.is_absolute_price
                                ? formatPrice(Number(option.price_delta))
                                : `+ ${formatPrice(Number(option.price_delta))}`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {modifiers.some(g => g.product_modifier_options.some(o => o.is_removal)) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-body-md font-semibold text-neutral-900">QUITAR</p>
                    <span className="text-[10px] text-neutral-400">(sin costo)</span>
                  </div>
                  <div className="space-y-2">
                    {modifiers.flatMap(g => g.product_modifier_options.filter(o => o.is_removal))
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((option) => {
                      const group = modifiers.find(g => g.product_modifier_options.some(o => o.id === option.id));
                      const isActive = group ? isSelected(group.id, option.id) : false;
                      
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => group && toggleOption(group, option.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${
                            isActive
                              ? "border-neutral-400 bg-neutral-100"
                              : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <MinusCircle className={`size-5 ${isActive ? 'text-neutral-600' : 'text-neutral-300'}`} />
                            <span className="text-body-md text-neutral-900 dark:text-neutral-100">{option.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {hasQuantityOptions && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-body-md font-semibold text-neutral-900">SELECCIONÁ LA CANTIDAD</p>
              </div>
              <div className="space-y-2">
                {quantityOptions
                  .sort((a, b) => a.quantity - b.quantity)
                  .map((option) => {
                  const isActive = selectedQuantityOption === option.id;
                  const isBetterDeal = option.is_best_deal;
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedQuantityOption(option.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${
                        isActive
                          ? "border-primary-500 bg-primary-50"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-5 rounded-full border-2 flex items-center justify-center transition ${
                          isActive ? "border-primary-500 bg-primary-500" : "border-neutral-300"
                        }`}>
                          {isActive && <Check className="size-3 text-white" />}
                        </div>
                        <span className="text-body-md font-medium text-neutral-900">
                          {option.quantity} {option.quantity === 1 ? 'unidad' : option.quantity <= 6 ? 'unidades' : 'unidades'}
                        </span>
                        {isBetterDeal && (
                          <span className="text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full font-medium">
                            Mejor precio
                          </span>
                        )}
                      </div>
                      <span className="text-body-md font-bold text-neutral-900">
                        {formatPrice(Number(option.price))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showManualQuantity && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-body-md font-semibold text-neutral-900">CANTIDAD</p>
              </div>
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="size-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Minus className="size-5" />
                </button>
                <span className="text-heading-lg font-bold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="size-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Plus className="size-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <button
            onClick={handleConfirm}
            disabled={!allRequiredFilled}
            className="w-full bg-primary-600 text-white font-semibold py-4 rounded-xl text-body-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-between px-6"
          >
            <span>Agregar al carrito</span>
            <span>{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}