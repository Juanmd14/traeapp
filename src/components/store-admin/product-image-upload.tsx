"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  currentUrl: string | null;
  onUploadComplete: (url: string) => void;
};

const MAX_SIZE_MB = 2;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProductImageUpload({
  productId,
  currentUrl,
  onUploadComplete,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato no válido. Usá JPG, PNG o WebP");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen es muy grande (máx ${MAX_SIZE_MB}MB)`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      await uploadImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (base64: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/upload-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, imageBase64: base64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir imagen");
      }

      onUploadComplete(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setLoading(false);
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          displayUrl ? "border-neutral-200" : "border-neutral-300 hover:border-neutral-400",
          loading && "opacity-50 pointer-events-none"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {displayUrl ? (
          <div className="relative aspect-video w-full">
            <Image
              src={displayUrl}
              alt="Imagen del producto"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              disabled={loading}
            >
              <span className="text-white text-sm font-medium">
                Cambiar imagen
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-video flex flex-col items-center justify-center gap-2 py-8 text-neutral-500 hover:text-neutral-700 transition-colors"
            disabled={loading}
          >
            <ImageIcon className="size-8" />
            <span className="text-body-sm">
              {loading ? "Subiendo..." : "Subir imagen"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-body-sm text-destructive">{error}</p>
      )}

      <p className="text-body-xs text-neutral-500">
        Imagen del producto. Recomendado: rectangular, min 400x300px
      </p>
    </div>
  );
}