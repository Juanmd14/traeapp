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

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

/**
 * Para un comercio cerrado, devuelve un texto con la próxima apertura, ej:
 *   "Abre a las 9:00"      (abre hoy más tarde)
 *   "Abre mañana 9:00"
 *   "Abre el lunes 9:00"
 * Devuelve null si no hay horarios o no encuentra apertura en los próximos 7 días.
 */
export function nextOpenLabel(
  rows: StoreHourRow[],
  now: Date = new Date(),
): string | null {
  if (!rows || rows.length === 0) return null;
  const { weekday, hhmm } = nowInArgentina(now);

  // Recorre hoy (tramos que abren después de ahora) y los próximos 6 días.
  for (let offset = 0; offset < 7; offset++) {
    const day = (weekday + offset) % 7;
    const candidates = rows
      .filter((r) => r.weekday === day)
      .map((r) => r.opens_at.slice(0, 5))
      // Hoy: solo tramos que todavía no abrieron.
      .filter((opens) => offset > 0 || opens > hhmm)
      .sort();

    if (candidates.length === 0) continue;
    const opens = formatHHMM(candidates[0]!);

    if (offset === 0) return `Abre a las ${opens}`;
    if (offset === 1) return `Abre mañana ${opens}`;
    return `Abre el ${DAY_NAMES[day]} ${opens}`;
  }

  return null;
}

/** "09:00" → "9:00" (saca el cero inicial de la hora). */
function formatHHMM(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}:${m}`;
}
