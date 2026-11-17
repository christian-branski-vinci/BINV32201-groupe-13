# Conversation 4 — Audit des tests des candidatures

## Demande

Réaliser un audit des tests liés aux candidatures des étudiants, correspondant aux
fonctionnalités EF-32 et EF-33.

## Périmètre retenu

- Backend : routes `GET /applications`, `POST /applications` et
  `DELETE /applications/:id`.
- Frontend : dépôt depuis les offres, consultation des candidatures et retrait.
- Priorité aux tests d’intégration backend, puis aux tests ciblés frontend.
- Audit réalisé en lecture seule dans un premier temps.

## Résultats de l’audit

Aucun risque P0 n’a été identifié. Les principaux écarts étaient :

1. Aucun test frontend direct du dépôt d’une candidature depuis `OffersPage`.
2. Aucun test frontend direct de `ApplicationsPage`, `useApplications` ou
   `ApplicationTable`.
3. Absence de tests 401/403 pour les trois routes backend de candidatures.
4. Absence de tests pour plusieurs frontières de validation : corps invalide,
   identifiants invalides et limite de 2000 caractères.
5. Assertion incomplète dans le test du retrait d’une candidature sélectionnée :
   le test ne vérifiait pas explicitement que l’offre restait inchangée.

## Action demandée

Ajouter les tests d’autorisation 401/403 aux trois routes backend.

## Modification réalisée

Dans `backend/tests/applications.test.ts`, ajout de tests paramétrés pour :

| Route | Sans session | Administrateur |
|---|---:|---:|
| `GET /applications` | 401 `UNAUTHENTICATED` | 403 `FORBIDDEN` |
| `POST /applications` | 401 `UNAUTHENTICATED` | 403 `FORBIDDEN` |
| `DELETE /applications/:id` | 401 `UNAUTHENTICATED` | 403 `FORBIDDEN` |

## Vérifications

- `npm run test -w backend -- tests/applications.test.ts` : 15 tests réussis.
- `npm run lint -w backend` : réussi.

Le dossier `docs/semaine-4/` contenait déjà un bilan d’audit associé.
