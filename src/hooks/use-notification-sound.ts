"use client";

import { useCallback, useRef } from "react";

/**
 * Beep sintético usando Web Audio API.
 * No necesita archivo de sonido — es un tono generado en el browser.
 */
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Patrón de notificación tipo "ding-dong" en dos tonos
      const playTone = (frequency: number, startAt: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(ctx.currentTime + startAt);
        oscillator.stop(ctx.currentTime + startAt + duration);
      };

      playTone(880, 0, 0.18);     // primer tono
      playTone(1175, 0.18, 0.25); // segundo, más agudo
    } catch (e) {
      // browsers que bloquean autoplay sin gesto previo del usuario
      console.warn("No se pudo reproducir el sonido:", e);
    }
  }, []);

  return { play };
}
