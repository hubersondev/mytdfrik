import { addBusinessMinutes, computeDeadlines, isBusinessDay } from './sla';

/** Helpers de lecture : un instant UTC. */
const utc = (y: number, m: number, d: number, h = 0, min = 0): Date =>
  new Date(Date.UTC(y, m - 1, d, h, min));

describe('sla — jours ouvrés', () => {
  it('lundi–vendredi sont ouvrés, week-end non', () => {
    expect(isBusinessDay(utc(2026, 6, 8))).toBe(true); // lundi
    expect(isBusinessDay(utc(2026, 6, 12))).toBe(true); // vendredi
    expect(isBusinessDay(utc(2026, 6, 13))).toBe(false); // samedi
    expect(isBusinessDay(utc(2026, 6, 14))).toBe(false); // dimanche
  });

  it('exclut les jours fériés ivoiriens fixes', () => {
    expect(isBusinessDay(utc(2026, 8, 7))).toBe(false); // Indépendance
    expect(isBusinessDay(utc(2026, 12, 25))).toBe(false); // Noël
    expect(isBusinessDay(utc(2026, 1, 1))).toBe(false); // Nouvel An
  });
});

describe('sla — addBusinessMinutes', () => {
  it('ajoute des minutes dans la même journée ouvrée', () => {
    // lundi 8 juin 2026 09h00 + 120 min ouvrées → 11h00
    expect(addBusinessMinutes(utc(2026, 6, 8, 9), 120)).toEqual(
      utc(2026, 6, 8, 11),
    );
  });

  it('déborde sur le jour ouvré suivant', () => {
    // lundi 17h00 + 120 min : 1h jusqu'à 18h, reste 60 min → mardi 09h00
    expect(addBusinessMinutes(utc(2026, 6, 8, 17), 120)).toEqual(
      utc(2026, 6, 9, 9),
    );
  });

  it('saute le week-end', () => {
    // vendredi 12 juin 17h00 + 120 min → lundi 15 juin 09h00
    expect(addBusinessMinutes(utc(2026, 6, 12, 17), 120)).toEqual(
      utc(2026, 6, 15, 9),
    );
  });

  it('démarre au prochain créneau ouvré si hors fenêtre (samedi)', () => {
    // samedi + 60 min → lundi 09h00
    expect(addBusinessMinutes(utc(2026, 6, 13, 10), 60)).toEqual(
      utc(2026, 6, 15, 9),
    );
  });

  it('cale avant 08h sur l’ouverture du jour', () => {
    // lundi 06h00 + 60 min → lundi 09h00
    expect(addBusinessMinutes(utc(2026, 6, 8, 6), 60)).toEqual(
      utc(2026, 6, 8, 9),
    );
  });

  it('saute un jour férié intercalé', () => {
    // jeudi 6 août 2026 17h00 + 120 min ; vendredi 7 = Indépendance (férié)
    // 1h jusqu'à 18h jeudi, reste 60 min → lundi 10 août 09h00 (vend. férié, w-e)
    expect(addBusinessMinutes(utc(2026, 8, 6, 17), 120)).toEqual(
      utc(2026, 8, 10, 9),
    );
  });
});

describe('sla — computeDeadlines', () => {
  it('P0 (24/7) calcule en calendaire', () => {
    const from = utc(2026, 6, 13, 22); // samedi 22h
    const res = computeDeadlines(from, {
      slaFirstResponseMinutes: 30,
      slaResolutionMinutes: 240,
      is24x7: true,
    });
    expect(res.firstResponseDueAt).toEqual(utc(2026, 6, 13, 22, 30));
    expect(res.resolutionDueAt).toEqual(utc(2026, 6, 14, 2)); // +4h calendaires
  });

  it('P1 (ouvré) calcule en heures ouvrées', () => {
    const from = utc(2026, 6, 8, 9); // lundi 09h
    const res = computeDeadlines(from, {
      slaFirstResponseMinutes: 120, // 2h ouvrées → 11h
      slaResolutionMinutes: 600, // 10h ouvrées = 1 j ouvré → mardi 09h
      is24x7: false,
    });
    expect(res.firstResponseDueAt).toEqual(utc(2026, 6, 8, 11));
    expect(res.resolutionDueAt).toEqual(utc(2026, 6, 9, 9));
  });
});
