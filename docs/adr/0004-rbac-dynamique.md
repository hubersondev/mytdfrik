# ADR-004 — RBAC dynamique (rôles éditables + permissions)

| Champ | Valeur |
|---|---|
| **Statut** | Accepté |
| **Date** | 2026-06-06 |
| **Décideur** | Département Développement TECHDIFRIK |
| **Référence projet** | CDC MyTDFRIK v0.3.1 (`docs/cdc/`) |
| **Supersedes** | Matrice de droits fixe CDC §2.3 (partiel — voir §Périmètre) |
| **Superseded by** | — |

## Contexte

Le CDC §2 définissait **5 rôles figés** (`CLIENT`, `GESTIONNAIRE`, `RESPONSABLE`, `ADMIN`, `DG`) avec une matrice de droits statique (§2.3). L'implémentation S1 reflétait ce choix : table `roles` à 5 lignes seedées, type `RoleCode` énuméré, décorateur `@Roles('ADMIN')` + `RolesGuard` comparant le code de rôle.

L'organisation souhaite désormais un modèle plus souple :

- **Deux portails distincts** : un portail **Admin** (rôles internes) et un portail **Client**.
- La capacité de **créer/éditer/supprimer des rôles** et de leur **attribuer des permissions** sans déploiement, de part et d'autre.
- Un seul rôle **figé** : `ADMIN` (super-utilisateur).

## Décision

Mise en place d'un **RBAC dynamique** :

1. **Rôles dynamiques.** La table `roles` devient éditable. Chaque rôle porte un `scope` (`INTERNAL` → portail Admin, `CLIENT` → portail Client), un drapeau `is_system`, un statut `is_active` et un soft-delete. Le `code` (PK) est **immuable après création** (le libellé, la description et les permissions restent modifiables).
2. **`ADMIN` figé.** Seul rôle `is_system` : non supprimable, non désactivable, possède **toutes** les permissions implicitement (bypass dans le guard).
3. **Catalogue de permissions figé, défini par le code** (`src/rbac/permissions.catalog.ts`). L'Administrateur **attribue** les permissions aux rôles, mais ne peut pas en créer — chaque permission protège réellement du code via `@RequirePermissions(...)`.
4. **Un seul rôle par utilisateur** (`users.role_id` inchangé). Le scope du rôle détermine le portail d'atterrissage.
5. **Résolution des droits à chaque requête** dans `JwtStrategy.validate` (qui charge déjà l'utilisateur) → `req.user.scope` + `req.user.permissions` toujours frais ; une modification de rôle/permissions prend effet immédiatement, sans attendre le renouvellement du JWT.
6. **`PermissionsGuard` + `@RequirePermissions(...)`** remplacent `RolesGuard` + `@Roles(...)` (ET logique : toutes les permissions listées sont requises).

## Périmètre

Supersede **partiellement** la matrice fixe du CDC §2.3 :

| Élément CDC §2 | Statut |
|---|---|
| Existence des 5 rôles métier | **Conservé** — seedés comme socle (éditables sauf ADMIN) |
| Matrice de droits **figée** par rôle | **Remplacé** — droits attribués dynamiquement via permissions |
| Séparation Client / Interne | **Renforcé** — formalisée par le `scope` du rôle |

## Conséquences

**Positives**
- Souplesse organisationnelle sans déploiement.
- Les permissions reflètent les capacités réelles du code (catalogue figé).
- Fraîcheur immédiate des droits (résolution par requête).

**Négatives / points d'attention**
- Léger surcoût : une lecture des permissions du rôle par requête authentifiée (acceptable au volume MVP ; un cache mémoire pourra être ajouté si besoin).
- Le retrait d'une permission du catalogue laisse des lignes orphelines dans `role_permissions` (sans danger : le guard ignore les codes inconnus).
- La suppression d'un rôle est bloquée s'il est attribué à des utilisateurs (réaffectation préalable requise).

## Mise en œuvre

- Migration `RbacDynamicSchema` : évolution de `roles`, table `role_permissions`.
- Seeds : `roles.seed` (scope + système) et `role-permissions.seed` (attributions par défaut, additives).
- Backend livré en PR 1/2 ; le portail de gestion `/admin/roles` et le routage par scope côté front en PR 2/2.
