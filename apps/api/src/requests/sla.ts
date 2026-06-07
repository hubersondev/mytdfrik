/**
 * Calcul des échéances SLA (CDC §5.6) en **heures ouvrées** (référentiel
 * Africa/Abidjan = UTC±0, lun–ven 08h00–18h00, jours fériés ivoiriens fixes
 * exclus). La priorité P0 est traitée en calendaire 24/7 (`is24x7`).
 *
 * Pur et testable : aucune dépendance d'infrastructure. Les durées cibles
 * (en minutes ouvrées) proviennent du référentiel `priority_levels`.
 */

export const BUSINESS_START_HOUR = 8; // 08h00 UTC (= Abidjan)
export const BUSINESS_END_HOUR = 18; // 18h00 UTC
const BUSINESS_MINUTES_PER_DAY = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60;

/**
 * Jours fériés **fixes** ivoiriens (mois 1-12, jour). Les fêtes mobiles
 * (Pâques, Aïd, Mawlid…) ne sont pas incluses au MVP — l'Administrateur
 * pourra surcharger le calendrier en V1.1 (CDC §5.6.3 [EXG-05-072]).
 */
const FIXED_HOLIDAYS: Array<{ month: number; day: number }> = [
  { month: 1, day: 1 }, // Jour de l'an
  { month: 5, day: 1 }, // Fête du Travail
  { month: 8, day: 7 }, // Fête de l'Indépendance
  { month: 8, day: 15 }, // Assomption
  { month: 11, day: 1 }, // Toussaint
  { month: 11, day: 15 }, // Journée nationale de la Paix
  { month: 12, day: 25 }, // Noël
];

function isHoliday(d: Date): boolean {
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return FIXED_HOLIDAYS.some((h) => h.month === m && h.day === day);
}

/** Jour ouvré = lundi–vendredi et non férié. */
export function isBusinessDay(d: Date): boolean {
  const dow = d.getUTCDay(); // 0 = dimanche, 6 = samedi
  return dow >= 1 && dow <= 5 && !isHoliday(d);
}

/** Début de la fenêtre ouvrée d'un jour donné (08h00 UTC). */
function startOfBusinessDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      BUSINESS_START_HOUR,
    ),
  );
}
function endOfBusinessDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      BUSINESS_END_HOUR,
    ),
  );
}
function nextDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() + 1,
      BUSINESS_START_HOUR,
    ),
  );
}

/**
 * Avance `start` de `minutes` **ouvrées**. Si `start` tombe hors fenêtre
 * ouvrée, le compteur démarre au prochain créneau ouvré.
 */
export function addBusinessMinutes(start: Date, minutes: number): Date {
  let cursor = new Date(start.getTime());
  let remaining = minutes;

  // Cale le curseur sur le prochain instant ouvré.
  cursor = nextBusinessInstant(cursor);

  while (remaining > 0) {
    const dayEnd = endOfBusinessDay(cursor);
    const availableMs = dayEnd.getTime() - cursor.getTime();
    const availableMin = Math.floor(availableMs / 60_000);

    if (remaining <= availableMin) {
      return new Date(cursor.getTime() + remaining * 60_000);
    }
    remaining -= availableMin;
    cursor = nextBusinessInstant(nextDay(cursor));
  }
  return cursor;
}

/** Prochain instant ouvré ≥ `d` (avance au créneau lun–ven 08h–18h). */
function nextBusinessInstant(d: Date): Date {
  let cursor = new Date(d.getTime());
  // Boucle bornée : au plus quelques itérations (week-end + fériés consécutifs).
  for (let i = 0; i < 31; i++) {
    if (!isBusinessDay(cursor)) {
      cursor = startOfBusinessDay(nextDay(cursor));
      continue;
    }
    const dayStart = startOfBusinessDay(cursor);
    const dayEnd = endOfBusinessDay(cursor);
    if (cursor.getTime() < dayStart.getTime()) return dayStart;
    if (cursor.getTime() >= dayEnd.getTime()) {
      cursor = startOfBusinessDay(nextDay(cursor));
      continue;
    }
    return cursor;
  }
  return cursor;
}

export interface SlaTargets {
  slaFirstResponseMinutes: number;
  slaResolutionMinutes: number;
  is24x7: boolean;
}

export interface SlaDeadlines {
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
}

/**
 * Calcule les échéances SLA d'une demande à partir de sa date de référence
 * (création, ou réouverture). P0 (24/7) → calendaire ; autres → heures ouvrées.
 */
export function computeDeadlines(
  from: Date,
  targets: SlaTargets,
): SlaDeadlines {
  if (targets.is24x7) {
    return {
      firstResponseDueAt: new Date(
        from.getTime() + targets.slaFirstResponseMinutes * 60_000,
      ),
      resolutionDueAt: new Date(
        from.getTime() + targets.slaResolutionMinutes * 60_000,
      ),
    };
  }
  return {
    firstResponseDueAt: addBusinessMinutes(
      from,
      targets.slaFirstResponseMinutes,
    ),
    resolutionDueAt: addBusinessMinutes(from, targets.slaResolutionMinutes),
  };
}

/** Échéance de résolution décalée du temps passé en attente client (ms). */
export function shiftResolutionForWaiting(
  resolutionDueAt: Date,
  waitingMs: number,
  is24x7: boolean,
): Date {
  if (waitingMs <= 0) return resolutionDueAt;
  if (is24x7) {
    return new Date(resolutionDueAt.getTime() + waitingMs);
  }
  return addBusinessMinutes(resolutionDueAt, Math.floor(waitingMs / 60_000));
}

export { BUSINESS_MINUTES_PER_DAY };
