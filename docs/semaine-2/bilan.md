# Bilan — semaine 2 : les candidatures (EF-32, EF-33, RG-03)

## Choix

- **Retrait d'une candidature retenue (`SELECTED`)** : décision prise : elle peut être retirée, en plus de `IN_PROGRESS`. Un étudiant retenu par plusieurs entreprises doit pouvoir se désister, et l'entreprise doit alors pouvoir choisir un autre candidat. Cela s'écarte d'une lecture stricte de « tant qu'elle n'a pas été traitée » (une candidature retenue est déjà traitée). Le cahier des charges ne tranche pas ce point, nous assumons ce choix.
- Le retrait ne déclenche aucun remplacement automatique et ne rouvre pas l'offre (EF-34 est hors périmètre).
- Après un retrait, l'étudiant peut recandidater : une nouvelle ligne est créée et l'historique de la ligne retirée est conservé. Le candidat repasse ainsi en fin de liste, ce qui conserve l'ordre de candidature.
- Autres règles retenues :
  1. Une candidature ne peut viser qu'une offre publiée (RG-03).
  2. Une candidature active en double est refusée.
  3. Le message est facultatif, trimé et limité à 2000 caractères.
  4. La liste est limitée par défaut à l'année académique courante.
  5. Les candidatures `REJECTED` et `WITHDRAWN` ne peuvent pas être retirées.
- Nous avons relu le plan avant de l'approuver et vérifié qu'il ne faisait pas plus que demandé.

## Résultat

- **Fonctionne** : candidater à une offre publiée avec ou sans message, consulter ses candidatures avec leur statut en français, retirer une candidature `IN_PROGRESS` ou `SELECTED`, recandidater après un retrait. `npm run check` passe (lint, typecheck, 133 tests backend, 50 tests frontend, build).
- **Limites restantes** :
  - aucun test automatisé côté frontend pour les candidatures (bouton Candidater, formulaire, retrait, erreurs) ;
  - aucun test automatisé pour le message de plus de 2000 caractères ;
  - la limite de 2000 caractères est vérifiée avant le trim : un message de 2000 caractères suivi d'espaces est refusé à tort ;
  - les refus 401/403 sont assurés par le middleware côté serveur, mais sans test dédié dans `applications.test.ts`.
- **Difficulté** : l'IA a annoncé avoir testé « message > 2000 refusé » alors qu'aucun test ne le vérifie (voir Qualité).

## Modifications

Aucune migration n'a été nécessaire : la table `applications` existait déjà.

**Backend**
- `models/application.ts`, `mappers/application.mapper.ts` : objets métier, DBO et DTO.
- `repositories/applications.repository.ts` : requêtes SQLite (liste, doublon actif, insertion, retrait).
- `services/applications.service.ts` : contrôle étudiant, offre publiée, doublon actif, message, propriété de la candidature.
- `controllers/applications.controller.ts` : `GET /applications`, `POST /applications`, `DELETE /applications/:id`.
- `app.ts` : branchement des routes.
- `tests/applications.test.ts`, `API.md`, `http/applications.http`, `docs/architecture.md`, `README.md`.

**Frontend**
- `models/application.ts`, `services/applications.service.ts`, `utils/guards.ts`, `utils/labels.ts`.
- `hooks/useApplications.ts`, `pages/ApplicationsPage.tsx`, `components/ApplicationTable.tsx` : page « Mes candidatures ».
- `pages/OffersPage.tsx`, `components/OfferTable.tsx` : bouton Candidater et formulaire (étudiants uniquement).
- `App.tsx`, `components/NavBar.tsx` : route et lien réservés aux étudiants.

## Validation fonctionnelle

Cas essayés dans le navigateur avec les comptes de démonstration :

**Réussis**
- candidature avec et sans message ;
- candidature et statut toujours présents après rechargement ;
- retrait d'une candidature en cours ;
- candidature après avoir retiré la sienne ;
- doublon actif refusé (comportement attendu) ;
- retrait impossible pour une candidature « Non retenue » (Léa Mertens : pas de bouton) ;
- chaque étudiant ne voit que ses candidatures ;
- un administrateur ne voit pas « Mes candidatures » (`/candidatures` : « Page introuvable »).

**Couvert par un test backend, non testable dans l'interface**
- offre non publiée refusée.

**Non testé**
- message de plus de 2000 caractères (le textarea est limité à 2000 côté frontend).

## Qualité

- Vérification de la chaîne backend : controller → service → repository, conforme à l'architecture.
- Le service plafonne le message à 2000 caractères (`MAX_MESSAGE_LENGTH`) et le textarea a un `maxLength` de 2000. L'IA affirmait avoir testé « message > 2000 refusé » alors qu'aucun test ne le vérifie : ambiguïté entre ce que l'IA a dit tester et les tests réellement fournis.

## Tests et commandes

- `npm run check` : lint, typecheck, 133 tests backend, 50 tests frontend, build : tout passe.
- Tests ajoutés (`backend/tests/applications.test.ts`, 6 tests) :
  - liste uniquement les candidatures de l'étudiant connecté ;
  - accepte une candidature avec un message normalisé ;
  - refuse les doublons actifs et les offres non publiées ;
  - retire une candidature retenue sans modifier l'offre ;
  - conserve l'historique et permet de recandidater après un retrait ;
  - refuse le retrait d'une candidature non retenue et l'accès d'un autre étudiant.
- Aucun test frontend ajouté pour les candidatures. Les tests de `OffersPage.test.tsx` portent sur le filtre par période (semaine 1).
- Exemple de comportement couvert : après un retrait, l'étudiant peut recandidater et l'ancienne ligne `WITHDRAWN` est conservée.

## Observation

Les tests générés par l'IA couvrent les règles critiques mais pas l'affichage ni la longueur du message : ce manque a été vu après l'implémentation, il faudra le demander dès la planification.