import type { RequestStatus } from '../database/entities';
import {
  isTransitionCode,
  resolveClientReplyTarget,
  TRANSITIONS,
  transitionsFrom,
} from './state-machine';

/**
 * Vérifie la cohérence de la machine à états (CDC §4.3) : couverture des
 * transitions, statuts source/cible valides, motifs obligatoires et résolution
 * de la reprise après attente client (T13/T14/T15).
 */
describe('state-machine — définition', () => {
  const STATUSES: RequestStatus[] = [
    'NOUVELLE',
    'EN_ATTENTE_AFFECTATION',
    'AFFECTEE',
    'EN_COURS',
    'EN_ATTENTE_CLIENT',
    'RESOLUE',
    'CLOTUREE',
    'ANNULEE',
  ];

  it('couvre les transitions T02–T19 + CLIENT_REPLY', () => {
    const codes = Object.keys(TRANSITIONS).sort();
    expect(codes).toEqual(
      [
        'T02',
        'T03',
        'T04',
        'T05',
        'T06',
        'T07',
        'T08',
        'T09',
        'T10',
        'T11',
        'T12',
        'T16',
        'T17',
        'T18',
        'T19',
        'CLIENT_REPLY',
      ].sort(),
    );
  });

  it('T17 (clôture auto) est une transition système RESOLUE → CLOTUREE', () => {
    expect(TRANSITIONS.T17.actor.kind).toBe('SYSTEM');
    expect(TRANSITIONS.T17.from).toEqual(['RESOLUE']);
    expect(TRANSITIONS.T17.to).toBe('CLOTUREE');
  });

  it('a des statuts source/cible valides', () => {
    for (const def of Object.values(TRANSITIONS)) {
      for (const from of def.from) {
        expect(STATUSES).toContain(from);
      }
      if (def.to !== null) {
        expect(STATUSES).toContain(def.to);
      }
    }
  });

  it('exige un motif sur les transitions sensibles (rejet, complément, refus, résolution, réouverture)', () => {
    expect(TRANSITIONS.T05.requiresNote).toBe(true); // rejet
    expect(TRANSITIONS.T03.requiresNote).toBe(true); // complément
    expect(TRANSITIONS.T09.requiresNote).toBe(true); // refus affectation
    expect(TRANSITIONS.T11.requiresNote).toBe(true); // résolution
    expect(TRANSITIONS.T18.requiresNote).toBe(true); // refus résolution
    expect(TRANSITIONS.T19.requiresNote).toBe(true); // réouverture
    expect(TRANSITIONS.T02.requiresNote).toBe(false); // qualification simple
    expect(TRANSITIONS.T16.requiresNote).toBe(false); // validation
  });

  it('mappe chaque transition à un acteur cohérent', () => {
    expect(TRANSITIONS.T02.actor).toEqual({
      kind: 'PERMISSION',
      permission: 'requests.qualify',
    });
    expect(TRANSITIONS.T06.actor).toEqual({
      kind: 'PERMISSION',
      permission: 'requests.assign',
    });
    expect(TRANSITIONS.T08.actor).toEqual({
      kind: 'PERMISSION',
      permission: 'requests.process',
    });
    expect(TRANSITIONS.T04.actor).toEqual({ kind: 'CLIENT_OWNER' });
    expect(TRANSITIONS.T16.actor).toEqual({ kind: 'CLIENT_OWNER' });
  });

  it('transitionsFrom(NOUVELLE) renvoie T02, T03, T04, T05', () => {
    const codes = transitionsFrom('NOUVELLE')
      .map((t) => t.code)
      .sort();
    expect(codes).toEqual(['T02', 'T03', 'T04', 'T05']);
  });

  it('transitionsFrom(EN_COURS) renvoie T10, T11, T12', () => {
    const codes = transitionsFrom('EN_COURS')
      .map((t) => t.code)
      .sort();
    expect(codes).toEqual(['T10', 'T11', 'T12']);
  });

  it('aucune transition sortante depuis ANNULEE (état terminal)', () => {
    expect(transitionsFrom('ANNULEE')).toHaveLength(0);
  });

  it('CLOTUREE ne permet que la réouverture (T19)', () => {
    expect(transitionsFrom('CLOTUREE').map((t) => t.code)).toEqual(['T19']);
  });

  it('isTransitionCode discrimine les codes connus', () => {
    expect(isTransitionCode('T02')).toBe(true);
    expect(isTransitionCode('CLIENT_REPLY')).toBe(true);
    expect(isTransitionCode('T99')).toBe(false);
    expect(isTransitionCode('T13')).toBe(false); // T13 est résolu dynamiquement
  });
});

describe('resolveClientReplyTarget — reprise après attente client', () => {
  it('reprend en NOUVELLE (T13)', () => {
    expect(resolveClientReplyTarget('NOUVELLE')).toEqual({
      to: 'NOUVELLE',
      effectiveCode: 'T13',
    });
  });

  it('reprend en EN_ATTENTE_AFFECTATION (T14)', () => {
    expect(resolveClientReplyTarget('EN_ATTENTE_AFFECTATION')).toEqual({
      to: 'EN_ATTENTE_AFFECTATION',
      effectiveCode: 'T14',
    });
  });

  it('reprend en EN_COURS (T15)', () => {
    expect(resolveClientReplyTarget('EN_COURS')).toEqual({
      to: 'EN_COURS',
      effectiveCode: 'T15',
    });
  });

  it('renvoie null si pas de statut antérieur ou statut non repris', () => {
    expect(resolveClientReplyTarget(null)).toBeNull();
    expect(resolveClientReplyTarget('RESOLUE')).toBeNull();
    expect(resolveClientReplyTarget('CLOTUREE')).toBeNull();
  });
});
