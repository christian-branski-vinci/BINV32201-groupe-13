# Bilan — semaine 3 : harnais agentique, guider et vérifier

## Contexte

La séance porte sur le harnais agentique : des **guides** orientent l'agent avant son travail (feedforward) et des **senseurs** lui donnent un retour sur le résultat (feedback). Nous avons inventorié les mécanismes du dépôt, examiné la couverture des tests pour EF-32 et EF-33, audité les guides à la lumière de Web 2, et proposé un senseur d'architecture. Les sections ont été rédigées par différents membres du groupe. Les conversations avec Copilot figurent dans `docs/semaine-3/` (`conversation-3.md` et `P2-couverture-tests.md`), l'inventaire de départ dans `P1-inventaire-guides-senseurs.md`.

## Inventaire des guides et senseurs

|  | Guide — feedforward | Senseur — feedback |
|---|---|---|
| **Inférentiel** | `.github/copilot-instructions.md`, `README.md`, `docs/architecture.md`, `.github/pull_request_template.md` | Aucun mécanisme versionné dans le dépôt |
| **Computationnel** | `.vscode/settings.json`, `.npmrc`, scripts npm | Oxlint, TypeScript, Vitest (backend et frontend), builds |

### Guides inférentiels

| Mécanisme | Fichier | Ce qu'il demande, exemple | Statut |
|---|---|---|---|
| Instructions de l'agent | `.github/copilot-instructions.md` | Couches `controllers -> services -> repositories`, ajouter une nouvelle migration plutôt que modifier une migration appliquée, « Do not rely on hiding controls in the frontend » | Lu en entier ; simple instruction, rien ne vérifie son application |
| Documentation | `README.md`, `docs/architecture.md` | Responsabilités des dossiers, flux d'une requête, `npm run check` avant chaque commit important | Décrit seulement |
| Checklist de revue | `.github/pull_request_template.md` | « `npm run check` passe », « Des tests couvrent… les cas d'erreur (400, 401, 403, 404…) » | Décrit seulement ; aucune CI n'applique cette liste |

### Guides computationnels

| Mécanisme | Fichier ou outil | Rôle et exemple | Statut |
|---|---|---|---|
| Permissions de l'agent | `.vscode/settings.json` | Approbation globale désactivée, écritures hors workspace bloquées, `git commit/push` et `npm install` soumis à approbation, `.env` protégé | Configuré ; non testé isolément cette séance |
| Installation sans scripts | `.npmrc` (`ignore-scripts=true`) | Empêche les dépendances d'exécuter des scripts à `npm ci` | Appliqué lors de l'installation |
| Scripts npm | `package.json` (racine, `backend`, `frontend`) | Commandes reproductibles : `lint`, `typecheck`, `test`, `build`, `check` | Exécutés avec succès via `npm run check` |

La frontière entre guide et senseur est floue pour les fichiers de configuration (`tsconfig`, `.oxlintrc.json`, `vite.config.ts`, `vitest.config.ts`) : ils configurent des contrôles. Ils sont rangés ci-dessous avec les senseurs.

### Senseurs computationnels

| Senseur | Fichier ou outil | Ce qu'il vérifie | Résultat |
|---|---|---|---|
| Oxlint | scripts `lint`, `backend/.oxlintrc.json`, `frontend/.oxlintrc.json` | Erreurs et avertissements (`--deny-warnings`), dont `no-explicit-any`, `eqeqeq`, règles des hooks et dépendances d'effets | Réussi, sans avertissement |
| TypeScript | scripts `typecheck`, `tsconfig.json` | Mode `strict`, variables inutilisées ; `noUncheckedIndexedAccess` dans `backend/tsconfig.json` et `frontend/tsconfig.app.json` | Réussi |
| Tests backend | `backend/tests`, Vitest et Supertest | Comportement HTTP, droits, base SQLite en mémoire | 10 fichiers, 136 tests réussis |
| Tests frontend | `frontend/tests`, Vitest et Testing Library | Rendu et comportement de l'interface | 7 fichiers, 50 tests réussis |
| Version de Node | `backend/src/nodeVersion.ts` appelé avant chaque fichier de test par `tests/helpers/requireSupportedNode.ts` | Refuse un Node trop ancien avec un message clair | Exécuté avec les tests |
| Migrations | `backend/tests/db/migrations.test.ts` | « n'applique pas deux fois la même migration » | Réussi ; rien n'empêche cependant de modifier une ancienne migration |
| Builds | scripts `build`, TypeScript et Vite | Compilation des deux workspaces | Réussi |

`engines.node` dans `package.json` n'est pas un contrôle réel : `.npmrc` n'active pas `engine-strict`, npm avertit seulement.

### Senseurs inférentiels

Aucun. L'analyse faite par Copilot pendant cette séance est ponctuelle ; ce n'est pas un senseur permanent du projet.

### Instruction ou contrôle

Les règles de `copilot-instructions.md` sont presque toutes de simples instructions : découpage en couches, usage de `HttpError`, codes de statut, conventions React. Les seuls contrôles réels sont `tsc` (typage strict), Oxlint, les tests et le build. Le découpage en couches n'est contrôlé par rien (voir le senseur proposé plus bas).

### Commande lancée

`npm run check` : lint, typecheck, 136 tests backend, 50 tests frontend et builds réussis.

## Couverture des exigences (EF-32 et EF-33)

Un cas est « couvert » seulement si les assertions portent sur son résultat attendu. Fichier de tests : `backend/tests/applications.test.ts`.

### EF-32 — Candidater et retirer sa candidature

| Cas | Test et assertions | Couverture |
|---|---|---|
| Candidater à une offre publiée avec message | `accepte une candidature avec un message normalisé` : 201, `IN_PROGRESS`, message sans espaces superflus | Couvert |
| Refuser une offre non publiée | `refuse les doublons actifs et les offres non publiées` : 400, `error.code === "INVALID_BODY"` | Partiel : un seul statut non publié testé (offre « Soumise ») |
| Refuser une offre inexistante | Aucun test | Absent |
| Refuser un doublon actif | Même test : 400, `INVALID_BODY` | Couvert |
| Retirer une candidature `IN_PROGRESS` | `retire une candidature en cours et conserve ce statut dans la liste` : 200, `WITHDRAWN`, puis liste avec l'identifiant et le statut | Couvert |
| Retirer une candidature `SELECTED` | `retire une candidature retenue sans modifier l'offre` : 200, `WITHDRAWN` | Partiel : le titre annonce que l'offre ne change pas, mais aucune assertion ne la relit |
| Refuser le retrait d'une candidature `REJECTED` | `refuse le retrait d'une candidature non retenue…` : 400, `INVALID_BODY` | Couvert |
| Refuser le retrait d'une candidature déjà retirée | Aucun test | Absent |
| Refuser le retrait par un autre étudiant | Même test : 404, `NOT_FOUND` | Couvert |
| Conserver l'historique et recandidater après un retrait | `conserve l'historique et permet de recandidater…` : 201, retrait `WITHDRAWN`, nouvelle candidature 201, liste avec les deux statuts | Couvert |
| Message absent ou vide enregistré à `null` | Aucune assertion sur `message === null` | Absent |
| Message de plus de 2000 caractères refusé | Aucun test dans le backend | Absent |
| Refuser un non-étudiant (403) et l'absence de session (401) sur `/applications` | Aucun test sur ces routes (401/403 testés pour `/auth`, `/offers`, `/companies`) | Absent |
| L'identifiant étudiant vient de la session, pas du corps | Aucun test | Absent |

### EF-33 — Consulter ses candidatures et leur statut

| Cas | Test et assertions | Couverture |
|---|---|---|
| Voir uniquement ses candidatures | `liste uniquement les candidatures de l'étudiant connecté` : longueur 2, identifiants exacts | Couvert |
| Voir les statuts `IN_PROGRESS`, `WITHDRAWN`, `SELECTED`, `REJECTED` | `retourne chaque statut de candidature uniquement à l'étudiant concerné` : identifiants et statuts exacts pour Inès, Mateusz et Léa | Couvert |
| Ne pas voir les candidatures d'un autre étudiant | Même test, plus l'accès refusé au retrait (404) | Couvert au niveau API |
| Exclure l'année académique ancienne | `exclut de la liste une candidature liée à une année académique ancienne` : candidature 2025-2026 insérée, liste vide | Couvert |
| Libellés français des statuts affichés | Aucun test frontend pour « Mes candidatures » | Absent |
| Bouton « Candidater » et formulaire | Aucun test frontend | Absent |

### Comportements testés hors EF-32 et EF-33

Authentification et jetons (`auth.test.ts`), permissions (`permissions.test.ts`), 401/403 sur offres et entreprises, contraintes SQL, migrations et cohérence du seed, cycle de vie des offres, entreprises, état et libellés de l'interface (`OffersPage`, `CompaniesPage`, `NavBar`…), version de Node.

## Modifications et vérification

### Tests ajoutés ou améliorés (`backend/tests/applications.test.ts`)

- **Nouveau** : retrait d'une candidature en cours et vérification de son statut dans la liste.
- **Nouveau** : chaque statut (`IN_PROGRESS`, `WITHDRAWN`, `SELECTED`, `REJECTED`) n'est vu que par l'étudiant concerné.
- **Nouveau** : une candidature d'une année académique ancienne est exclue de la liste.
- **Renforcé** : les refus existants vérifient maintenant le code d'erreur (`INVALID_BODY`, `NOT_FOUND`).
- Quelques lignes existantes ont été reformatées, sans changement de comportement.

Défauts qui feraient échouer ces tests (raisonnement, **non vérifié** en cassant volontairement le code) : suppression de la transition `IN_PROGRESS` vers `WITHDRAWN`, suppression du filtrage par `student_id`, suppression du filtre sur l'année courante, mauvaise correspondance des statuts.

### Commandes lancées

`npm run check` après les modifications :

| Contrôle | Résultat |
|---|---|
| Lint | Réussi, sans avertissement |
| Typecheck | Réussi |
| Tests backend | 10 fichiers, 136 tests réussis |
| Tests frontend | 7 fichiers, 50 tests réussis |
| Build backend et frontend | Réussi |

### Vérifications manuelles

Des vérifications manuelles ont aussi été effectuées pour s’assurer que les contrôles et l’audit ont été réalisés correctement.

### Limites restantes

- Cas absents du tableau : message de plus de 2000 caractères, 401/403 sur `/applications`, identifiant étudiant forgé, message vide enregistré à `null`, offre inexistante, retrait d'une candidature déjà retirée, statut de l'offre après le retrait d'une candidature retenue.
- Aucun test frontend pour le bouton « Candidater », le formulaire, la page « Mes candidatures » et les libellés de statut.
- Les tests ajoutés n'ont pas été vérifiés en introduisant volontairement un défaut dans le code.

[COLLER ICI la section « Audit des guides à la lumière de Web 2 », avec ses sous-sections, fournie dans le message précédent. Elle commence par `## Audit des guides à la lumière de Web 2`.]

## Senseur d'architecture proposé (non implémenté)

### Règle vérifiée et pourquoi

Les dépendances entre couches décrites dans `copilot-instructions.md` et `docs/architecture.md` :

- **Backend** : `controllers → services → repositories`. Un service n'importe ni `express`, ni `controllers/`, ni `middlewares/`. Un contrôleur n'importe pas de repository. Un repository n'importe ni service ni contrôleur.
- **Frontend** : `pages → hooks → services ou utils → models`. Une page n'importe pas directement `services/`. Un composant n'importe ni `pages/`, ni `hooks/`, ni `services/`. Un hook n'importe ni `pages/` ni `components/`.

Ces règles sont écrites mais aucun contrôle ne les vérifie : une violation compile, passe le lint et les tests. Elles reposent sur les guides du projet, pas sur Web 2.

### Cas réel qui motive la proposition

`frontend/src/pages/OffersPage.tsx` (ligne 9) importe `createApplication` depuis `../services/applications.service.ts` et gère l'état d'envoi dans la page, en contournant la couche hooks. Cette violation, ajoutée en semaine 2, a passé `npm run check`. Une recherche rapide des imports montre que le backend respecte les règles et qu'il s'agit de la seule violation du frontend. Cette recherche est une vérification manuelle ; le senseur n'a pas été implémenté.

### Quand il fonctionne

Un test Vitest (par exemple `backend/tests/architecture.test.ts` et `frontend/tests/architecture.test.ts`) exécuté par `npm test`, donc par `npm run check`, avant chaque commit important (feedback local et rapide). Il pourrait aussi tourner en CI si elle est ajoutée.

### Ce qu'il examine et ce qu'il produit

Il lit les fichiers sources `src/**/*.ts(x)`, extrait les chemins d'import, associe chaque fichier à sa couche d'après son dossier, puis compare les paires (couche importatrice, couche importée) à une table de paires interdites. En cas de violation, le test échoue avec un message qui indique le fichier, la ligne, la règle violée et la correction attendue, par exemple :

> `frontend/src/pages/OffersPage.tsx:9` importe `services/applications.service.ts`. Règle front-2 : une page ne doit pas appeler un service directement. Créez ou utilisez un hook (par exemple `useApplyToOffer`).

### Exemples de violations qui doivent déclencher un retour

- Une page qui importe un service (cas actuel d'`OffersPage.tsx`).
- Un service qui ajoute `import type { Request } from "express"`.
- Un contrôleur qui importe `applications.repository.ts` au lieu de passer par le service.

### Faux positifs, limites et coûts

- **Faux positifs** : un `import type` de simple typage pourrait être légitime (à autoriser explicitement) ; un fichier de test ou de configuration doit être exclu.
- **Contournements** : les imports par alias, les réexportations (`index.ts`) et les imports dynamiques ne sont pas détectés par une simple lecture des chemins.
- **Portée limitée** : le senseur vérifie les imports, pas la logique. Une règle métier mal placée dans un contrôleur n'est pas détectée.
- **Coût** : environ 50 à 80 lignes de code, sans nouvelle dépendance (les bibliothèques comme `dependency-cruiser` ajouteraient une dépendance, que le projet évite ; leur compatibilité avec Oxlint n'a pas été vérifiée). La table de règles doit être maintenue. Le temps d'exécution reste à mesurer.
- **Mise en place** : à l'introduction, le test échouerait sur `OffersPage.tsx`. Il faudrait corriger cette page (déplacer l'appel dans un hook) ou l'autoriser temporairement avec un commentaire.

## Difficultés et limites générales

- Les citations produites par Copilot lors de l'audit étaient parfois reformulées au lieu d'être littérales. Elles ont été recoupées avec les fichiers et corrigées.
- Les fiches de Web 2 sont incomplètes (séances 10 et 21 absentes) et ne couvrent pas les tests, le lint ni l'accessibilité.
- Le senseur d'architecture est une proposition, pas une implémentation.
- Les tests ajoutés n'ont pas été éprouvés par un défaut volontaire dans le code.