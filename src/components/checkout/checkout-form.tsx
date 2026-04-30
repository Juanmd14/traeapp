"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Banknote, CreditCard, Check } from "lucide-react";

import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { formatPrice, cn } from "@/lib/utils";
import { createOrderAction } from "@/server/actions/orders";

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
  const storeSlug = useCart((s) => s.storeSlug);
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

  // Si no hay items en el carrito, redirige
  useEffect(() => {
    if (typeof window !== "undefined" && items.length === 0) {
      router.replace("/");
    }
  }, [items.length, router]);

  if (items.length === 0 || !storeId) {
    return null;
  }

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

      // Limpiar carrito
      clear();

      // Si hay checkout URL (Mercado Pago), redirigir
      if (result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        router.push(`/pedido/${result.data.orderId}`);
      }
    });
  };

  return (
    <div className="container-shop py-4 pb-32">
      <Link
        href="/carrito"
        className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 mb-3"
      >
        <ChevronLeft className="size-4" />
        Volver al carrito
      </Link>

      <header className="mb-5">
        <h1 className="text-heading-xl font-semibold text-neutral-900">
          Confirmar pedido
        </h1>
        {storeName && (
          <p className="text-body-md text-neutral-500 mt-0.5">En {storeName}</p>
        )}
      </header>

      {/* Dirección */}
      <section className="mb-5">
        <h2 className="text-heading-sm font-semibold text-neutral-900 mb-2">
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
                      "w-full text-left bg-white border-2 rounded-md p-3 flex gap-3 items-start transition",
                      isSelected ? "border-primary-600" : "border-neutral-200 hover:border-neutral-300",
                    )}
                  >
                    <MapPin className={cn("size-5 mt-0.5 shrink-0", isSelected ? "text-primary-600" : "text-neutral-400")} />
                    <div className="flex-1 min-w-0">
                      {addr.label && (
                        <p className="text-body-sm font-medium text-neutral-900">{addr.label}</p>
                      )}
                      <p className="text-body-sm text-neutral-600 truncate">
                        {addr.street}{addr.number ? ` ${addr.number}` : ""}
                        {addr.apartment ? `, ${addr.apartment}` : ""}
                      </p>
                    </div>
                    {isSelected && <Check className="size-5 text-primary-600 shrink-0" />}
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
            <FormField
              label="Dirección de entrega"
              required
            >
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
        <h2 className="text-heading-sm font-semibold text-neutral-900 mb-2">
          ¿Cómo querés pagar?
        </h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("cash")}
            className={cn(
              "w-full text-left bg-white border-2 rounded-md p-3 flex gap-3 items-center transition",
              paymentMethod === "cash" ? "border-primary-600" : "border-neutral-200 hover:border-neutral-300",
            )}
          >
            <div className="size-9 bg-accent-100 text-accent-700 rounded-md flex items-center justify-center shrink-0">
              <Banknote className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-body-md font-medium text-neutral-900">Efectivo</p>
              <p className="text-body-xs text-neutral-500">Pagás cuando recibís</p>
            </div>
            {paymentMethod === "cash" && <Check className="size-5 text-primary-600" />}
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("mercadopago")}
            className={cn(
              "w-full text-left bg-white border-2 rounded-md p-3 flex gap-3 items-center transition",
              paymentMethod === "mercadopago" ? "border-primary-600" : "border-neutral-200 hover:border-neutral-300",
            )}
          >
            <div className="size-9 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center shrink-0">
              <CreditCard className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-body-md font-medium text-neutral-900">Mercado Pago</p>
              <p className="text-body-xs text-neutral-500">Tarjeta, dinero en cuenta o transferencia</p>
            </div>
            {paymentMethod === "mercadopago" && <Check className="size-5 text-primary-600" />}
          </button>
        </div>
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

      {/* Resumen */}
      <section className="bg-white rounded-md border border-neutral-200 p-4 space-y-2 mb-5">
        <div className="flex justify-between text-body-md">
          <span className="text-neutral-600">Subtotal</span>
          <span className="text-neutral-900">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-body-md">
          <span className="text-neutral-600">Envío</span>
          <span className={deliveryFee === 0 ? "text-accent-600 font-medium" : "text-neutral-900"}>
            {deliveryFee === 0 ? "Gratis" : formatPrice(deliveryFee)}
          </span>
        </div>
        <div className="border-t border-neutral-200 pt-2 flex justify-between text-heading-md font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </section>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 px-3 py-2 rounded-md mb-4">
          {serverError}
        </p>
      )}

      {/* CTA sticky */}
      <div className="fixed bottom-16 sm:bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 z-20">
        <div className="container-shop">
          <Button fullWidth size="lg" onClick={onConfirm} loading={isPending}>
            {paymentMethod === "mercadopago"
              ? `Pagar con Mercado Pago · ${formatPrice(total)}`
              : `Confirmar pedido · ${formatPrice(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
