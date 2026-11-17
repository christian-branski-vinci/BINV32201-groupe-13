# Bilan — semaine 4 : skills, tests et hooks

## Contexte

La séance porte sur les skills, les tests et les hooks. Nous avons installé deux skills dans `.github/skills/` : `test-gap-audit` (audit des tests) et `test-driven-development` (adapté pour s'arrêter avant l'implémentation). Le hook Tool Guardian, optionnel, n'a pas été réalisé. Les conversations figurent dans `docs/semaine-4/` : `conversation-4.md` (audit des candidatures) et `conversation-recherche-tdd.md` (recherche avec le TDD).

## 1. Audit des tests des candidatures (EF-32 et EF-33)

### Installation du skill

- Dossier `.github/skills/test-gap-audit/` avec `SKILL.md` et `scripts/coverage_map.py` (commits `f1b7f2c` et `fb72170`).
- L'en-tête YAML a été lu par un analyseur YAML : il est valide (`name: test-gap-audit`, `description`, `license`).
- Dans Copilot : `/skills reload`, puis `/test-gap-audit les tests des candidatures (EF-32 et EF-33)`. Copilot a lu le skill, lancé `coverage_map.py` (90 fichiers source, 22 fichiers de test, 21 appariés, 69 non appariés) et les tests ciblés (backend : 9 tests, frontend `OffersPage` : 8 tests), sans modifier de fichier.

### Constats vérifiés

Les constats ci-dessous viennent de l'audit de Copilot. Les références de lignes ont été relues dans le code après l'ajout des tests 401/403, qui a décalé `applications.test.ts`.

| Cas à vérifier | Test existant et assertion utile | Preuves | Manque confirmé ou constat écarté |
|---|---|---|---|
| Parcours frontend de dépôt d'une candidature | Les tests `OffersPage` couvrent les profils contact/admin, filtres, affichage et erreurs de chargement ; aucun test frontend ne contient applications, candidatures ou `createApplication`. | `OffersPage.tsx:40`, `OffersPage.tsx:85`, `OffersPage.test.tsx` | **Manque confirmé.** Le parcours étudiant (sélectionner une offre, saisir le message, envoyer, fermer le formulaire) et ses erreurs n'ont pas de test direct. |
| Affichage et retrait des candidatures côté frontend | Le backend prouve les retraits, mais aucune preuve frontend ne vérifie chargement, liste vide, libellés de statut, bouton seulement pour `IN_PROGRESS`/`SELECTED`, confirmation oui/non, mise à jour après retrait ou gestion 401/500. | `ApplicationsPage.tsx:12`, `useApplications.ts:11`, `ApplicationTable.tsx:17` | **Manque confirmé.** `ApplicationsPage`, `useApplications` et `ApplicationTable` n'ont aucun test direct. |
| Contrats 401/403 des routes candidatures | Aucun test n'envoyait de requête sans jeton ni avec un profil non étudiant sur `GET`, `POST` et `DELETE`. | `API.md:253`, `API.md:273`, `API.md:284`, `applications.controller.ts:32` | **Manque confirmé, puis comblé** par les tests ajoutés (voir ci-dessous). |
| Frontières de validation backend | Un message normal est trimé, les offres non publiées et les doublons sont refusés ; les bornes et formes invalides ne sont pas prouvées. | `applications.controller.ts:9`, `applications.controller.ts:16`, `applications.service.ts:8`, `applications.service.ts:30`, `applications.test.ts:56` | **Manque confirmé.** Corps non objet, `offerId` non entier positif, message non chaîne, id de retrait malformé, message de 2000/2001 caractères et message blanc ou `null` ne sont pas testés. |
| Retrait d'une candidature retenue | Le test vérifie `200` et le statut `WITHDRAWN` de la candidature. | `applications.test.ts:104`, `applications.service.ts:37` | **Assertion incomplète.** Le test est nommé « sans modifier l'offre » mais ne relit pas l'offre. |

### Constats ajoutés lors de la vérification manuelle

Ces points ne figurent pas dans l'audit de Copilot ; ils ont été relevés en relisant le code et les tests.

- **Un seul statut d'offre non publiée est testé.** Le test de refus (`applications.test.ts:70`) utilise l'offre `CLIENT_PORTAL`, au statut « Soumise » (`docs/seed.md:56`). Les statuts `PENDING`, `ASSIGNED` et `ARCHIVED` ne sont pas testés.
- **Retrait d'une candidature retenue : règle à confirmer.** EF-32 permet de retirer sa candidature « tant qu'elle n'a pas été traitée », alors que le service accepte le retrait d'une candidature `SELECTED` (documenté dans `API.md`). Il faut décider si c'est voulu.
- **Retrait d'une candidature déjà retirée** : non testé (le service renvoie 400).
- **Offre inexistante** : même branche que l'offre non publiée (`applications.service.ts:25`), donc déjà exécutée, mais non testée comme cas distinct.

### Test ajouté : 401 et 403 sur `/applications`

Dans `backend/tests/applications.test.ts` (commit `037f464`), deux blocs `it.each` couvrent `GET`, `POST` et `DELETE` :

| Route | Sans session | Administrateur |
|---|---|---|
| `GET /applications` | 401 `UNAUTHENTICATED` | 403 `FORBIDDEN` |
| `POST /applications` | 401 `UNAUTHENTICATED` | 403 `FORBIDDEN` |
| `DELETE /applications/:id` | 401 `UNAUTHENTICATED` | 403 `FORBIDDEN` |

Le code d'erreur `UNAUTHENTICATED` vient de `backend/API.md` (Copilot avait d'abord proposé `UNAUTHORIZED`, qui n'existe pas dans le projet).

**Ce que ces tests ne prouvent pas :**

- Seul l'administrateur est testé pour le 403 : un contact (par exemple le déposant `CONTACT.MARC_LEJEUNE`) ne l'est pas.
- Aucun test avec un jeton invalide ou expiré.
- Le `POST` est envoyé sans corps valide, et le `DELETE` ne relit pas la candidature pour vérifier qu'elle n'a pas changé.
- La route est protégée deux fois : `studentOnly` dans le contrôleur et `requireStudent` dans le service (`applications.service.ts:11`). Pour `GET` et `DELETE`, retirer seulement `studentOnly` renverrait toujours 403 `FORBIDDEN` via le service, et ces tests ne le détecteraient pas. Pour `POST`, envoyé sans corps valide, la requête échouerait en 400 avant d'atteindre le service : le test détecterait le retrait, mais pour une raison qui n'est pas celle qu'il prétend vérifier.

**Défauts qui feraient échouer ces tests** (raisonnement, **non vérifié** en cassant volontairement le code) : retrait de `authenticate` au montage de `/applications` dans `app.ts` (tests 401), retrait des deux garde-fous `studentOnly` et `requireStudent` (tests 403).

### Un problème de typage découvert par `npm run check`

La conversation 4 ne mentionne que le test ciblé (15 tests réussis) et le lint du backend. Le premier `npm run check` complet a échoué à l'étape `typecheck` :

```text
tests/applications.test.ts(34,28): error TS2532: Object is possibly 'undefined'.
tests/applications.test.ts(34,28): error TS2722: Cannot invoke an object which is possibly 'undefined'.
tests/applications.test.ts(45,28): error TS2532 / TS2722 (même cause)
```

Cause : le test choisissait la requête par un index (`applicationRequests()[index]()`), et `noUncheckedIndexedAccess` (activé dans `backend/tsconfig.json`) rend ce résultat possiblement `undefined`. Vitest ne vérifie pas les types : les tests passaient, mais `npm run check` échouait. Correction : la liste `applicationRoutes` contient directement la fonction d'envoi de chaque route ; les requêtes et les assertions sont identiques. Après correction : lint, typecheck et les 15 tests de `applications.test.ts` réussissent.

### Suite donnée aux autres constats

Le travail du groupe sur cette partie s'est limité à l'audit (`conversation-4.md`) et aux tests 401/403 décrits ci-dessus. Les autres constats (tests frontend du dépôt et du retrait, validations backend, statuts d'offre non publiée, retrait d'une candidature déjà retirée, assertion sur l'offre après le retrait d'une candidature retenue) n'ont **pas** été traités : ils restent des limites (voir plus bas).

## 2. TDD : recherche d'offres par titre

### Installation

Dossier `.github/skills/test-driven-development/` (`SKILL.md`, `writing-good-tests.md`, `LICENSE` de Superpowers, MIT), consigne d'arrêt ajoutée au début du corps de `SKILL.md`, paragraphe ajouté à `.github/copilot-instructions.md` (commit `dea7e28`). L'en-tête YAML est valide et ne contient pas `disable-model-invocation`.

### Déclenchement

Après `/skills reload` (134 skills), nous avons donné les six règles sans `/` et sans parler de tests. La première action de Copilot a été `Read skill [test-driven-development]` : le skill s'est déclenché de lui-même, avant toute lecture du code applicatif.

Copilot s'est d'abord arrêté sur un **plan** (sans tests). Nous l'avons relancé en lui demandant d'écrire et d'exécuter les tests, de lier chaque test à une règle et de signaler séparément les choix hors des six règles. Il a ensuite écrit les tests sans toucher au code de l'application ni à la documentation, puis s'est arrêté pour demander la validation.

### Avis sur les tests proposés avant l'accord

Premier lot : 8 tests backend et 4 tests frontend. Il couvrait bien les règles (sous-chaîne sans casse, espaces, expression entière, recherche vide, aucun résultat, titre seul, visibilité étudiant avec un terme présent dans un titre non publié), mais nous avons relevé **trois faiblesses** avant de donner notre accord :

1. **Combinaison avec la période non prouvée.** `application` + `period=P2` ne trouve que deux offres déjà en P2 ; une implémentation qui ignorerait `period` dès qu'il y a une recherche aurait réussi. Remplacé par `tests` + `period=OTHER` (une seule offre) et `tests` + `period=P2` (liste vide).
2. **Assertion frontend trop faible sur la recherche vide.** Elle vérifiait qu'une requête vers `/api/offers` avait eu lieu, ce que le chargement initial satisfaisait déjà. Remplacée par la vérification que la **dernière** requête est exactement `/api/offers`, sans `q`.
3. **Aucun test pour `%`.** Avec `LIKE`, `%` correspondrait à tout. Test ajouté : `?q=%25` renvoie une liste vide. Nous avons aussi accepté un test de `q` répété (400 `INVALID_QUERY`), comme pour `period`.

Choix hors des six règles, validés : libellé « Rechercher par titre », message « Aucune offre ne correspond à la recherche. », paramètre `q`, délai de saisie de 300 ms côté frontend, `%` littéral, `q` répété refusé.

### Tests vus en échec avant l'implémentation

Lot final : 10 tests backend et 4 tests frontend de recherche. Résultat annoncé par Copilot : 9 rouges backend, 4 rouges frontend. Nous l'avons **reproduit nous-mêmes** en retirant temporairement le code de la recherche (`git stash` de `backend/src` et `frontend/src`, puis restauration vérifiée par somme de contrôle) :

| Suite | Résultat sans le code de la recherche |
|---|---|
| `backend/tests/offers.test.ts` | 9 échecs, 23 réussites (32 tests) |
| `frontend/tests/OffersPage.test.tsx` | 4 échecs, 8 réussites (12 tests) |

Les échecs viennent bien de l'absence de la fonctionnalité, pas d'une erreur de syntaxe ou d'installation :

- Backend, par exemple `recherche une sous-chaîne sans distinguer la casse` : `expected [ 8, 2, 4, 7, 5, 1, 3, 6, 10, 9 ] to deeply equal [ 1 ]` (le paramètre `q` est ignoré, toutes les offres reviennent).
- Backend, `combine la recherche avec le filtre de période` : `expected [ 8, 4 ] to deeply equal [ 4 ]` (les deux offres de période `OTHER` reviennent).
- Backend, `refuse un paramètre q répété` : `expected 200 to be 400`.
- Frontend (4 tests) : `Unable to find a label with the text of: Rechercher par titre`.

Seul le test « recherche vide » backend réussissait déjà, comme prévu.

### Implémentation et tests en réussite

Après notre accord explicite, Copilot a modifié `offers.controller.ts` (lecture de `q`, `INVALID_QUERY` si répété), `offers.repository.ts` (`LIKE` avec échappement de `%`, `_` et `\`), `offers.service.ts`, ainsi que `useOffers.ts`, `offers.service.ts` et `OffersPage.tsx` côté frontend (champ de recherche, paramètres construits avec `URLSearchParams`, message adapté, délai de 300 ms). La visibilité (`visibilityFilter`) n'est pas modifiée : la recherche s'y ajoute.

Les tests n'ont pas été modifiés après l'accord. La documentation (`backend/API.md`, `backend/http/offers.http`, `README.md`) a été mise à jour **après** l'implémentation, hors de la séance TDD.

Résultats de `npm run check` après l'implémentation : voir plus bas.

### Coût de l'exercice

Nous avons mesuré la consommation de la séance simplement : nous avons relevé le compteur de crédits de Copilot (offre Copilot Student, plafond de 200 crédits, remise à zéro le 1er décembre) avant puis après la séance, et calculé la différence. Il est passé de 36,5 à 54,2 crédits utilisés, soit **17,7 crédits** pour la séance.

Cette mesure est approximative : le compteur affiche des crédits, pas des jetons, et il ne distingue pas ce qui a été consommé par chaque conversation.

## 3. Hook Tool Guardian

Non réalisé : l'activité est facultative et le groupe a choisi de ne pas la faire. Aucune installation (`.github/hooks/`) ni essai n'a eu lieu, il n'y a donc aucune preuve de déclenchement.

## 4. Recherche : cas essayés et contrôles

**Cas essayés dans le navigateur** (`npm run dev`, connexion en étudiant puis en administrateur). Pour chaque cas, le comportement observé correspondait à celui attendu ; nous n'avons constaté aucun écart.

| Cas essayé | Résultat attendu (et observé) |
|---|---|
| `application`, en étudiant | Une seule offre : « Application React de gestion de flotte » (l'offre « Migration d'une application vers le cloud » n'est pas publiée) |
| `application`, en administrateur | Deux offres : la précédente et « Migration d'une application vers le cloud » |
| Texte en majuscules, minuscules ou mixte, avec des espaces avant et après | Même résultat que le texte nettoyé |
| `api` | « API REST de facturation » ; l'administrateur voit aussi « Numérisation d'archives papier » (archivée) |
| Plusieurs mots (`gestion de flotte`) | L'offre qui contient l'expression entière ; les mots dans un autre ordre ne donnent rien |
| Texte sans correspondance | Liste vide et message « Aucune offre ne correspond à la recherche. » |
| Recherche vidée ou faite d'espaces | Retour à la liste normalement accessible |
| Recherche combinée au filtre de période (`tests` avec « Autre », puis avec P2) | Une offre avec « Autre », aucune avec P2 |

**`npm run check` après l'implémentation** : lint réussi sans avertissement, typecheck réussi, 10 fichiers et 152 tests backend réussis (142 avant, plus les 10 tests de recherche), 7 fichiers et 54 tests frontend réussis (50 avant, plus les 4 tests de recherche), builds réussis.

**Problèmes restants relevés à la relecture du code** (non vérifiés dans le navigateur) :

- Contrairement à `GET /companies`, la recherche des offres n'a pas de longueur maximale pour `q` (100 caractères côté entreprises).
- Le délai de 300 ms s'applique aussi à un changement de période quand une recherche est active.
- Les accents ne sont pas gérés (hors périmètre) : `lower()` de SQLite ne plie que l'ASCII.

## Commandes lancées

`npm run check` sur la branche **avant** la recherche :

| Contrôle | Premier essai | Après correction du typage |
|---|---|---|
| Lint | Réussi | Réussi, sans avertissement (`--deny-warnings`) |
| Typecheck | **Échec** (`applications.test.ts`, voir ci-dessus) | Réussi (backend et frontend) |
| Tests backend | Non atteints | 10 fichiers, 142 tests réussis (136 en semaine 3, plus les 6 cas 401/403) |
| Tests frontend | Non atteints | 7 fichiers, 50 tests réussis |
| Build | Non atteint | Réussi (backend et frontend) |

Ces résultats concernent la branche avant l'ajout de la recherche. Après la recherche : 152 tests backend, 54 tests frontend, lint, typecheck et builds réussis (voir la section 4).

## Limites

- Les constats du tableau d'audit viennent de Copilot ; les références ont été revérifiées, mais le comportement n'a pas été rejoué constat par constat.
- Les tests 401/403 n'ont pas été éprouvés par un défaut volontaire dans le code.
- Aucun test frontend pour le dépôt et le retrait de candidature.
- Les validations backend (corps invalide, id malformé, 2000/2001 caractères, message blanc), les statuts d'offre non publiée autres que « Soumise », le retrait d'une candidature déjà retirée et l'assertion sur l'offre après le retrait d'une candidature retenue restent sans test.
- La règle du retrait d'une candidature `SELECTED` (autorisé par le code, alors qu'EF-32 parle d'une candidature « pas encore traitée ») reste à confirmer.
- La conversation 4 (`conversation-4.md`) est un résumé rédigé après coup de la partie 1, pas un export Copilot complet.
- La conversation de la partie 2 (`conversation-recherche-tdd.md`) est la transcription du panneau de chat : les sorties des outils y sont résumées. Les chiffres des tests rouges viennent de Copilot et de notre propre exécution (voir la section 2).
- Les essais dans le navigateur n'ont pas été automatisés : ils reposent sur notre observation.

## Conversations

- `conversation-4.md` : résumé de l'audit et de l'ajout des tests 401/403.
- `conversation-recherche-tdd.md` : transcription de la conversation Copilot de la partie 2 (recherche des offres avec le TDD), qui montre la lecture du skill, le plan, les deux validations des tests, l'implémentation et les vérifications.
