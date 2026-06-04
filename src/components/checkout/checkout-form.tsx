"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Banknote, CreditCard, Check, Tag, X } from "lucide-react";

import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { formatPrice, cn } from "@/lib/utils";
import { createOrderAction, validatePromoAction } from "@/server/actions/orders";
import { OrderConfirmedOverlay } from "./order-confirmed-overlay";

type Address = {
  id: string;
  label: string | null;
  street: string;
  number: string | null;
  apartment: string | null;
  city: string;
};

type Props = {
  addresses: Address[];
  userEmail: string | null;
};

export function CheckoutForm({ addresses, userEmail }: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const storeId = useCart((s) => s.storeId);
  const storeName = useCart((s) => s.storeName);
  const subtotal = useCart((s) => s.getSubtotal());
  const total = useCart((s) => s.getTotal());
  const deliveryFee = useCart((s) => s.deliveryFee);
  const clear = useCart((s) => s.clear);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mercadopago">("cash");
  const [addressId, setAddressId] = useState<string | undefined>(addresses[0]?.id);
  const [newAddressMode, setNewAddressMode] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    type: string;
    discountAmount: number;
  } | null>(null);

  // Estado del overlay de confirmación
  const [confirmed, setConfirmed] = useState<{
    orderNumber: number;
    method: "cash" | "mercadopago";
    redirectTo: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && items.length === 0 && !confirmed) {
      router.replace("/");
    }
  }, [items.length, router, confirmed]);

  // Redirigir al tracker después de mostrar la animación
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => {
      if (confirmed.redirectTo.startsWith("http")) {
        window.location.href = confirmed.redirectTo;
      } else {
        router.push(confirmed.redirectTo);
      }
    }, 3500);
    return () => clearTimeout(t);
  }, [confirmed, router]);

  if (items.length === 0 || !storeId) {
    if (confirmed) {
      return (
        <OrderConfirmedOverlay
          orderNumber={confirmed.orderNumber}
          paymentMethod={confirmed.method}
        />
      );
    }
    return null;
  }

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !storeId) return;
    setPromoError(null);
    setPromoValidating(true);
    const result = await validatePromoAction({ storeId, promoCode: promoInput.trim(), subtotal });
    setPromoValidating(false);
    if (result?.serverError) { setPromoError(result.serverError); return; }
    if (result?.data?.ok) {
      setAppliedPromo({ code: result.data.code, type: result.data.type, discountAmount: result.data.discountAmount });
      setPromoInput("");
    }
  };

  const selectedAddress = addresses.find((a) => a.id === addressId);
  const addressText = newAddressMode
    ? newAddress
    : selectedAddress
      ? `${selectedAddress.street}${selectedAddress.number ? " " + selectedAddress.number : ""}${selectedAddress.apartment ? ", " + selectedAddress.apartment : ""}`
      : "";

  const onConfirm = () => {
    setServerError(null);

    if (!addressText || addressText.length < 5) {
      setServerError("Ingresá una dirección válida");
      return;
    }

    startTransition(async () => {
      const result = await createOrderAction({
        storeId,
        addressId: !newAddressMode ? addressId : undefined,
        deliveryAddressText: addressText,
        paymentMethod,
        customerNotes: notes || undefined,
        promoCode: appliedPromo?.code,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          modifiers: it.modifiers ?? [],
          notes: it.notes,
        })),
      });

      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }

      if (!result?.data?.ok) {
        setServerError("No se pudo crear el pedido. Intentá de nuevo.");
        return;
      }

      // Vaciar carrito y mostrar overlay
      clear();

      setConfirmed({
        orderNumber: result.data.orderNumber,
        method: paymentMethod,
        redirectTo: result.data.checkoutUrl ?? `/pedido/${result.data.orderId}`,
      });
    });
  };

  return (
    <>
      {confirmed && (
        <OrderConfirmedOverlay
          orderNumber={confirmed.orderNumber}
          paymentMethod={confirmed.method}
        />
      )}

      <div className="container-shop py-4 pb-8">
        <Link
          href="/carrito"
          className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 mb-3"
        >
          <ChevronLeft className="size-4" />
          Volver al carrito
        </Link>

        <header className="mb-5">
          <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Confirmar pedido
          </h1>
          {storeName && (
            <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-0.5">En {storeName}</p>
          )}
        </header>

        {/* Dirección */}
        <section className="mb-5">
          <h2 className="text-heading-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            ¿Dónde te lo entregamos?
          </h2>
          <div className="space-y-2">
            {addresses.length > 0 && !newAddressMode && (
              <>
                {addresses.map((addr) => {
                  const isSelected = addr.id === addressId;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setAddressId(addr.id)}
                      className={cn(
                        "w-full text-left bg-white dark:bg-neutral-900 border-2 rounded-md p-3 flex gap-3 items-start transition-all",
                        isSelected
                          ? "border-accent-500 bg-accent-50 dark:bg-accent-950/20 ring-2 ring-accent-100"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600",
                      )}
                    >
                      <MapPin
                        className={cn(
                          "size-5 mt-0.5 shrink-0",
                          isSelected ? "text-accent-600" : "text-neutral-400",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        {addr.label && (
                          <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {addr.label}
                          </p>
                        )}
                        <p className="text-body-sm text-neutral-600 dark:text-neutral-400 truncate">
                          {addr.street}{addr.number ? ` ${addr.number}` : ""}
                          {addr.apartment ? `, ${addr.apartment}` : ""}
                        </p>
                      </div>
                      {isSelected && (
                        <Check
                          className="size-5 text-accent-600 shrink-0"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setNewAddressMode(true)}
                  className="text-body-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  + Usar otra dirección
                </button>
              </>
            )}
            {newAddressMode && (
              <FormField label="Dirección de entrega" required>
                <Input
                  placeholder="Ej: Av. San Martín 123"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNewAddressMode(false)}
                    className="text-body-sm font-medium text-primary-600 hover:text-primary-700 mt-2"
                  >
                    ← Usar dirección guardada
                  </button>
                )}
              </FormField>
            )}
          </div>
        </section>

        {/* Método de pago */}
        <section className="mb-5">
          <h2 className="text-heading-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            ¿Cómo querés pagar?
          </h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={cn(
                "w-full text-left bg-white dark:bg-neutral-900 border-2 rounded-md p-3 flex gap-3 items-center transition-all",
                paymentMethod === "cash"
                  ? "border-accent-500 bg-accent-50 dark:bg-accent-950/20 ring-2 ring-accent-100"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600",
              )}
            >
              <div className="size-9 bg-accent-100 text-accent-700 rounded-md flex items-center justify-center shrink-0">
                <Banknote className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-body-md font-medium text-neutral-900 dark:text-neutral-100">Efectivo</p>
                <p className="text-body-xs text-neutral-500 dark:text-neutral-400">Pagás cuando recibís</p>
              </div>
              {paymentMethod === "cash" && (
                <Check className="size-5 text-accent-600" strokeWidth={3} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("mercadopago")}
              className={cn(
                "w-full text-left bg-white dark:bg-neutral-900 border-2 rounded-md p-3 flex gap-3 items-center transition-all",
                paymentMethod === "mercadopago"
                  ? "border-accent-500 bg-accent-50 dark:bg-accent-950/20 ring-2 ring-accent-100"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600",
              )}
            >
              <div className="size-9 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center shrink-0">
                <CreditCard className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-body-md font-medium text-neutral-900 dark:text-neutral-100">Mercado Pago</p>
                <p className="text-body-xs text-neutral-500 dark:text-neutral-400">
                  Tarjeta, dinero en cuenta o transferencia
                </p>
              </div>
              {paymentMethod === "mercadopago" && (
                <Check className="size-5 text-accent-600" strokeWidth={3} />
              )}
            </button>
          </div>

          {paymentMethod === "mercadopago" && (
            <div className="mt-3 flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md px-3 py-2.5">
              <CreditCard className="size-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-body-sm text-blue-800 dark:text-blue-300">
                Vas a confirmar y te redirigimos a Mercado Pago para completar el pago de forma segura.
              </p>
            </div>
          )}
        </section>

        {/* Notas */}
        <section className="mb-5">
          <FormField
            label="Notas para el comercio"
            hint="Opcional. Aclaraciones sobre el pedido o entrega."
          >
            <Input
              placeholder="Ej: timbre roto, dejar en portería"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={280}
            />
          </FormField>
        </section>

        {/* Código de descuento */}
        <section className="mb-5">
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-accent-50 dark:bg-accent-950/20 border border-accent-200 dark:border-accent-900 rounded-md px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-accent-600" />
                <span className="text-body-sm font-medium text-accent-800">
                  {appliedPromo.code}
                  {appliedPromo.type === "free_delivery" ? " — Envío gratis" : ` — ${formatPrice(appliedPromo.discountAmount)} de descuento`}
                </span>
              </div>
              <button onClick={() => setAppliedPromo(null)} className="text-neutral-400 hover:text-neutral-700 transition">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <Input
                  placeholder="Código de descuento"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoValidating || !promoInput.trim()}
                  className="px-4 py-2 text-body-sm font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {promoValidating ? "..." : "Aplicar"}
                </button>
              </div>
              {promoError && <p className="text-body-xs text-destructive">{promoError}</p>}
            </div>
          )}
        </section>

        {/* Resumen */}
        <section className="bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 p-4 space-y-2 mb-5">
          <div className="flex justify-between text-body-md">
            <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
            <span className="text-neutral-900 dark:text-neutral-100">{formatPrice(subtotal)}</span>
          </div>
          {appliedPromo && appliedPromo.discountAmount > 0 && (
            <div className="flex justify-between text-body-md">
              <span className="text-accent-700">Descuento ({appliedPromo.code})</span>
              <span className="text-accent-700 font-medium">- {formatPrice(appliedPromo.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-body-md">
            <span className="text-neutral-600 dark:text-neutral-400">Envío</span>
            <span className={
              deliveryFee === 0 || appliedPromo?.type === "free_delivery"
                ? "text-accent-600 font-medium"
                : "text-neutral-900"
            }>
              {deliveryFee === 0 || appliedPromo?.type === "free_delivery" ? "Gratis" : formatPrice(deliveryFee)}
            </span>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 flex justify-between text-heading-md font-semibold dark:text-neutral-100">
            <span>Total</span>
            <span>
              {formatPrice(
                subtotal
                - (appliedPromo?.discountAmount ?? 0)
                + (appliedPromo?.type === "free_delivery" ? 0 : deliveryFee)
              )}
            </span>
          </div>
        </section>

        {serverError && (
          <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md mb-4">
            {serverError}
          </p>
        )}

        {/* CTA */}
        <div className="pt-2">
          <Button fullWidth size="lg" variant="success" onClick={onConfirm} loading={isPending}>
            {paymentMethod === "mercadopago"
              ? `Pagar con Mercado Pago · ${formatPrice(total)}`
              : `Confirmar pedido · ${formatPrice(total)}`}
          </Button>
        </div>
      </div>
    </>
  );
}