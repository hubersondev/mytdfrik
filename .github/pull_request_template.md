<!--
Référencer l'exigence CDC correspondante au format [EXG-NN-XXX] dans le titre de la PR ou ci-dessous.
-->

## Résumé

<!-- 1-3 phrases sur le changement et le pourquoi. -->

## Exigences CDC couvertes

- [ ] [EXG-NN-XXX]

## Type de changement

- [ ] `feat` — nouvelle fonctionnalité
- [ ] `fix` — correction de bug
- [ ] `chore` — outillage, dépendances, infra
- [ ] `refactor` — refactoring sans changement de comportement
- [ ] `test` — ajout de tests uniquement
- [ ] `docs` — documentation

## Définition fini

- [ ] Tests unitaires ajoutés / mis à jour (couverture ≥ 80% sur logique métier)
- [ ] Tests d'intégration ajoutés si endpoint API modifié
- [ ] Lint + typecheck verts en local
- [ ] Spec OpenAPI à jour si l'API change
- [ ] Documentation à jour (README, CDC si écart spec, ADR si décision structurante)
- [ ] Migration de base de données réversible si applicable
- [ ] Pas de secret dans le code
- [ ] Mention des breaking changes dans le titre (`feat!:` ou `BREAKING CHANGE:` en footer)

## Plan de test

<!-- Comment vérifier le changement (commandes, scénarios, captures d'écran). -->

## Notes pour le reviewer

<!-- Points d'attention, alternatives écartées, suivis prévus. -->
