/**
 * Catalogue **figé** des permissions MyTDFRIK (ADR-004 — RBAC dynamique).
 *
 * Source de vérité unique : ce fichier. Chaque permission protège réellement
 * du code (via `@RequirePermissions(...)`). L'Administrateur ne peut PAS créer
 * de permission ; il les attribue aux rôles. Ajouter une permission = ajouter
 * une entrée ici + l'appliquer sur la (ou les) route(s) concernée(s).
 *
 * `scope` indique le portail où la permission a du sens :
 *   - 'INTERNAL' : portail Admin (rôles internes)
 *   - 'CLIENT'   : portail Client
 *   - null       : indifférent
 * Il sert à filtrer les permissions proposées selon le scope du rôle dans l'UI.
 */

export type PermissionScope = 'INTERNAL' | 'CLIENT';

export interface PermissionDef {
  code: string;
  label: string;
  group: string;
  scope: PermissionScope | null;
}

export const PERMISSION_CATALOG: readonly PermissionDef[] = [
  // ---------- Demandes ----------
  {
    code: 'requests.create',
    label: 'Créer et soumettre des demandes',
    group: 'Demandes',
    scope: 'CLIENT',
  },
  {
    code: 'requests.read.all',
    label: 'Consulter toutes les demandes',
    group: 'Demandes',
    scope: 'INTERNAL',
  },
  {
    code: 'requests.qualify',
    label: 'Qualifier une demande (priorité, catégorie)',
    group: 'Demandes',
    scope: 'INTERNAL',
  },
  {
    code: 'requests.assign',
    label: 'Affecter une demande à un responsable',
    group: 'Demandes',
    scope: 'INTERNAL',
  },
  {
    code: 'requests.process',
    label: 'Traiter une demande affectée',
    group: 'Demandes',
    scope: 'INTERNAL',
  },
  {
    code: 'requests.close',
    label: 'Clôturer ou rejeter une demande',
    group: 'Demandes',
    scope: 'INTERNAL',
  },
  {
    code: 'requests.message',
    label: 'Échanger des messages sur une demande (dont messages internes)',
    group: 'Demandes',
    scope: 'INTERNAL',
  },
  {
    code: 'requests.attachment',
    label: 'Ajouter des pièces jointes à une demande',
    group: 'Demandes',
    scope: 'INTERNAL',
  },
  // ---------- Utilisateurs ----------
  {
    code: 'users.read',
    label: 'Consulter les utilisateurs',
    group: 'Utilisateurs',
    scope: 'INTERNAL',
  },
  {
    code: 'users.manage',
    label: 'Créer et gérer les utilisateurs',
    group: 'Utilisateurs',
    scope: 'INTERNAL',
  },
  // ---------- Organisations ----------
  {
    code: 'organizations.read',
    label: 'Consulter les organisations',
    group: 'Organisations',
    scope: 'INTERNAL',
  },
  {
    code: 'organizations.manage',
    label: 'Créer et gérer les organisations',
    group: 'Organisations',
    scope: 'INTERNAL',
  },
  // ---------- Catalogue ----------
  {
    code: 'catalog.manage',
    label: 'Gérer le catalogue (catégories, produits, priorités)',
    group: 'Catalogue',
    scope: 'INTERNAL',
  },
  // ---------- Géographie ----------
  {
    code: 'geo.manage',
    label: 'Gérer les pays et villes',
    group: 'Géographie',
    scope: 'INTERNAL',
  },
  // ---------- Rôles & permissions ----------
  {
    code: 'roles.read',
    label: 'Consulter les rôles et permissions',
    group: 'Rôles',
    scope: 'INTERNAL',
  },
  {
    code: 'roles.manage',
    label: 'Créer et gérer les rôles et leurs permissions',
    group: 'Rôles',
    scope: 'INTERNAL',
  },
  // ---------- Audit ----------
  {
    code: 'audit.read',
    label: "Consulter le journal d'audit",
    group: 'Audit',
    scope: 'INTERNAL',
  },
] as const;

export type PermissionCode = (typeof PERMISSION_CATALOG)[number]['code'];

/** Tous les codes de permission (utilisé pour l'ADMIN super-utilisateur). */
export const ALL_PERMISSION_CODES: readonly string[] = PERMISSION_CATALOG.map(
  (p) => p.code,
);

const VALID_CODES = new Set(ALL_PERMISSION_CODES);

/** Vrai si le code existe dans le catalogue. */
export function isValidPermissionCode(code: string): boolean {
  return VALID_CODES.has(code);
}
