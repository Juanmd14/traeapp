/**
 * Cálculo de "abierto ahora" a partir de los tramos de `store_hours`.
 * Un día puede tener varios tramos (ej: 08:00–13:00 y 14:00–17:00).
 */

export type StoreHourRow = {
  store_id?: string;
  weekday: number; // 0 = domingo … 6 = sábado
  opens_at: string; // "HH:MM" o "HH:MM:SS"
  closes_at: string;
};

const TIME_ZONE = "America/Argentina/Buenos_Aires";

/** Día de la semana (0-6) y hora "HH:MM" actuales en horario de Argentina. */
function nowInArgentina(now: Date = new Date()): { weekday: number; hhmm: string } {
  const local = new Date(now.toLocaleString("en-US", { timeZone: TIME_ZONE }));
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    weekday: local.getDay(),
    hhmm: `${pad(local.getHours())}:${pad(local.getMinutes())}`,
  };
}

/** True si la hora actual cae dentro de algún tramo del día de hoy. */
export function isStoreOpenNow(rows: StoreHourRow[], now: Date = new Date()): boolean {
  if (!rows || rows.length === 0) return false;
  const { weekday, hhmm } = nowInArgentina(now);
  return rows.some(
    (r) =>
      r.weekday === weekday &&
      hhmm >= r.opens_at.slice(0, 5) &&
      hhmm < r.closes_at.slice(0, 5),
  );
}

/**
 * Agrupa filas de `store_hours` por `store_id` y devuelve un set con los ids
 * que están abiertos ahora. Útil para listados de comercios.
 */
export function openStoreIds(rows: StoreHourRow[], now: Date = new Date()): Set<string> {
  const byStore = new Map<string, StoreHourRow[]>();
  for (const r of rows) {
    if (!r.store_id) continue;
    const list = byStore.get(r.store_id) ?? [];
    list.push(r);
    byStore.set(r.store_id, list);
  }
  const open = new Set<string>();
  for (const [id, list] of byStore) {
    if (isStoreOpenNow(list, now)) open.add(id);
  }
  return open;
}
