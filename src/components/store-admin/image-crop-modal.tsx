"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, ZoomIn, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const OUTPUT_SIZE = 800;

type Props = {
  /** Archivo original elegido por el usuario. */
  file: File;
  /** Devuelve el recorte ya aplicado como un nuevo File (jpeg). */
  onConfirm: (cropped: File) => void;
  onCancel: () => void;
};

/**
 * Modal de recorte 1:1 para enfocar el producto antes de subirlo.
 * El usuario arrastra y acerca la imagen dentro del marco; al confirmar
 * se dibuja el recorte en un canvas y se exporta como JPEG.
 */
export function ImageCropModal({ file, onConfirm, onCancel }: Props) {
  const [src, setSrc] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // px que mide un lado del marco cuadrado de recorte
  const vp = () => viewportRef.current?.clientWidth ?? 0;

  // escala mínima para que la imagen siempre cubra el marco
  const baseScale = useCallback(() => {
    if (!natural.w || !natural.h) return 1;
    const v = vp();
    return Math.max(v / natural.w, v / natural.h);
  }, [natural]);

  const dispScale = baseScale() * scale;

  const clamp = useCallback(
    (next: { x: number; y: number }) => {
      const v = vp();
      const dw = natural.w * dispScale;
      const dh = natural.h * dispScale;
      return {
        x: Math.min(0, Math.max(v - dw, next.x)),
        y: Math.min(0, Math.max(v - dh, next.y)),
      };
    },
    [natural, dispScale],
  );

  // re-centrar / re-clampear cuando cambia el zoom
  useEffect(() => {
    setOffset((o) => clamp(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, natural]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    // centrar
    const v = vp();
    const ds = Math.max(v / w, v / h);
    setOffset({ x: (v - w * ds) / 2, y: (v - h * ds) / 2 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset(
      clamp({ x: d.ox + (e.clientX - d.startX), y: d.oy + (e.clientY - d.startY) }),
    );
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !natural.w) return;

    const v = vp();
    const ds = baseScale() * scale;
    // región de la imagen original visible en el marco
    const sx = (0 - offset.x) / ds;
    const sy = (0 - offset.y) / ds;
    const sSize = v / ds;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const cropped = new File(
          [blob],
          file.name.replace(/\.\w+$/, "") + "-recortada.jpg",
          { type: "image/jpeg" },
        );
        onConfirm(cropped);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-neutral-900/70 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <Crop className="size-4 text-primary-600" />
          <h3 className="text-body-md font-semibold text-neutral-900 dark:text-neutral-100">
            Recortá la foto
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto size-7 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-500"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
            Arrastrá y usá el zoom para enfocar el producto. Lo que quede dentro del
            marco es lo que se va a mostrar.
          </p>

          <div
            ref={viewportRef}
            className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 touch-none cursor-grab active:cursor-grabbing select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={src}
                alt="Recortar"
                onLoad={onImgLoad}
                draggable={false}
                className="absolute top-0 left-0 max-w-none pointer-events-none"
                style={{
                  width: natural.w * dispScale,
                  height: natural.h * dispScale,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            )}
            {/* guía visual */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/40" />
          </div>

          <div className="flex items-center gap-3">
            <ZoomIn className="size-4 text-neutral-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-primary-600"
              aria-label="Zoom"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" fullWidth type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="success" fullWidth type="button" onClick={handleConfirm}>
              <Check className="size-4" />
              Usar recorte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
