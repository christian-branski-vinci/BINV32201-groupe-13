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

## Audit des guides à la lumière de Web 2

### Périmètre et méthode

- **Guides examinés** : `.github/copilot-instructions.md` (seul fichier de consignes destiné à l'agent), `README.md`, `docs/architecture.md` et `.github/pull_request_template.md`. Il n'existe ni `AGENTS.md`, ni `CLAUDE.md`, ni fichier `.instructions.md`. `.vscode/settings.json` règle les permissions de l'agent : c'est un contrôle, pas un guide, il n'est donc pas audité ici.
- **Références Web 2** : les 20 fiches théoriques fournies (séances 1 à 9, 11 à 20 et 22). Les séances 10 et 21, les exercices et les énoncés ne sont pas disponibles.
- **Méthode** : relevé des attentes avec l'aide de Copilot, puis recoupement des citations avec les fichiers. Chaque attente est classée (A) si elle est formulée dans le texte de la fiche, ou (B) si elle n'apparaît que dans un exemple de code. Une pratique (B) est « illustrée dans le cours », pas « exigée ».
- **Ce qui a été vérifié dans le code** : uniquement les points signalés « vérifié » ci-dessous. Aucun guide n'a été modifié.

### Tableau de correspondance

| Attente de Web 2 (source) | Guide examiné (fichier et passage) | Correspondance | Écart ou ajout proposé |
|---|---|---|---|
| (A) Le serveur gère « la logique métier, les données et la sécurité » (`06-client_serveur.md`, Résumé) | `copilot-instructions.md` : « services contain business rules », « repositories contain SQL » | Oui | — |
| (A) Le client gère « l'interface utilisateur et les interactions » (`06`, Résumé) | `copilot-instructions.md` : « `frontend/` is a React/Vite application. » | Partielle | Préciser le rôle du client (interface, interactions), et pas seulement la technologie. |
| (B) Controller → Service → DB (`03-middleware.md`, « Rappels web1 ») ; « Trois niveaux : application, router (controller), route. » (`03`, Résumé) | `architecture.md` : « controllers → services → repositories → SQLite » | Partielle | Le guide ajoute `repositories`, `mappers`, DBO et DTO, qui sont absents de Web 2. Les signaler comme extensions du projet. Les trois niveaux de middleware ne sont pas mentionnés. |
| (A) Un middleware est une « brique de traitement entre `req` et `res` » ; middleware d'erreur (`03`) | `architecture.md` : « middlewares (authenticate, authorize, errorHandler) » ; `copilot-instructions.md` : « `errorHandler` converts thrown `HttpError` instances to the stable JSON shape » | Oui | — |
| (A) « Un composant = Un module. » (`09-modules_collections.md`, Modules) | Aucun passage | Non | Ajouter : un composant par fichier, props typées. Priorité faible. |
| Aucune attente « MVVM » trouvée dans les fiches | `copilot-instructions.md` : « the course's MVVM structure » ; `architecture.md` : « Le frontend suit le modèle MVVM du cours. » | Source non retrouvée | Les fiches montrent `fetch` dans `useEffect` d'un composant, pas `pages → hooks → services`. Vérifier sur Moodle (séances 10 et 21 absentes) ou retirer « du cours ». |
| (A) « Il est obligatoire d'annoter explicitement le type » pour les paramètres et les retours de fonctions (`02-typescript.md`, TypeScript : les types) | Aucun passage (seule consigne TypeScript : les imports se terminent par `.ts`) | Non | Ajouter la règle au guide, ou une règle de lint. Les règles explicitement configurées (`no-explicit-any`, `no-unused-vars`, `eqeqeq`) ne l'imposent pas. |
| (A) « Les interfaces permettent de définir des types complexes. » (`02`) | `copilot-instructions.md` : « `models/` defining DBO/domain/DTO types » | Partielle | Les types sont demandés, pas spécifiquement les interfaces. Priorité faible. |
| (A) Ressources identifiées par des URLs, au pluriel ; méthodes HTTP selon l'opération (`04-REST.md`) | `copilot-instructions.md` : « Keep the API contract and REST Client examples synchronized with endpoint changes » | Partielle | Les conventions de nommage et d'usage des méthodes ne sont pas écrites. |
| (A) Paramètres de chemin et de requête (`04`) | `architecture.md` : « `GET /companies?q=` » | Partielle | Illustré par un exemple, pas formulé comme règle. |
| (A) Codes 400, 401, 403, 404, 409, 500 selon le résultat ; (B) 400, 409, 201 dans les routes (`04`, Codes d'erreur ; `19-json-web-tokens.md`, Routes) | `pull_request_template.md` : « cas d'erreur (400, 401, 403, 404…) » ; `architecture.md` : `authenticate` (401), `authorize` (403) | Partielle | Aucun guide ne dit quand utiliser chaque code, ni 409 pour un conflit. **Vérifié dans le code** : `applications.service.ts` (lignes 25 à 43) renvoie 400 pour le doublon actif, et aucun `HttpError(409` n'existe dans le backend. |
| (A) `express.json()` pour parser le JSON (`05-serialisation.md`) | Aucun passage | Non | Détail technique, priorité faible. |
| (B) Corps reçu comme `unknown`, vérifié par un type guard (`19`, Routes) | `README.md` : « Validation par type guards écrits à la main \| Pratique du cours » ; `architecture.md` : « validation des paramètres et du corps » | Oui | — |
| (A) « Tout le monde peut envoyer des requêtes au backend, pas seulement le frontend ! » et « Certaines requêtes doivent être restreintes à certains utilisateurs » (`19`, Authentification backend) | `copilot-instructions.md` : « Keep authorization and visibility rules in backend services/permission helpers. Do not rely on hiding controls in the frontend. » | Oui | — |
| (A) Pas de données sensibles dans le payload JWT (`19`) | `copilot-instructions.md` : « The token carries only `kind` and `id`. » | Oui | — |
| (A) Le backend vérifie la signature à chaque requête ; (B) 401 si le token est absent ou invalide, 403 sans droits (`19`) | `architecture.md` : « `authenticate` vérifie le jeton, puis relit en base », « Absent, invalide ou compte inactif : 401 », « `authorize(règle)` refuse la requête avec un 403 » | Oui | — |
| (A) « Valeur à garder secrète, ne pas partager sur git ! » (commentaire du bloc Configuration, `19`) | `README.md` : « `npm run setup` crée `backend/.env` (avec une clé de signature aléatoire) » | Partielle | La règle de ne pas versionner le secret n'est pas écrite. |
| (B) Durée de validité du JWT (`19`, Configuration) | Aucun passage | Non | Ajouter une ligne sur la durée de vie du jeton. |
| (A) Hachage salé des mots de passe, (B) `bcrypt.compare` (`20-chiffrement-mots-de-passe.md`) | `README.md` : « sans mot de passe » | Sans objet | Le mode démo n'a pas de mots de passe. Si une vraie authentification est ajoutée, exiger bcrypt. |
| (A) Le JWT est envoyé dans le header d'autorisation (`22-session-web-storage.md`) | `architecture.md` : « Le frontend l'envoie dans l'en-tête `Authorization` de chaque requête. » ; « sans préfixe `Bearer` » | Oui | — |
| (A) Différence entre `localStorage` et `sessionStorage` ; (B) token en `localStorage`, supprimé au logout (`22`) | `architecture.md` : « stockage du jeton » | Partielle | Le choix de `localStorage` n'est pas écrit. **Vérifié** : `utils/storage.ts` l'utilise, avec le commentaire « comme dans le cours ». |
| (A) Composants réutilisables (`08-react_vite.md`) | `architecture.md` : « Composants réutilisables, sans connaissance des routes » | Oui | — |
| (A) Clé `key` dans les listes (`09`) ; `preventDefault`, composants contrôlés (`12-formulaires.md`) ; gestionnaires d'événements (`11-evenements-etat.md`) | Aucun passage | Non | Ajouter quelques lignes de conventions React. Priorité faible. |
| (A) État partagé par les props ; React Context quand les props deviennent « fastidieux » (`13-etat-partage.md`) ; routes imbriquées sans props, `useOutletContext` (`15-etat-par-contexte.md`) | `architecture.md` : « Le jeton et la fonction de déconnexion sont transmis aux pages par les props. » | Partielle | Le guide retient les props et ne parle pas de Context. Cohérent avec les routes plates utilisées (`App.tsx`). Préciser quand passer au Context. |
| (A) React Router : chemin et composant, `Link`, `useNavigate`, routes imbriquées et `Outlet` (`14-router.md`) | `README.md` : « React Router, CSS simple » ; `architecture.md` : « Une page par route » | Partielle | `Link`, `useNavigate` et `Outlet` ne sont pas mentionnés. |
| (A) `fetch` dans un gestionnaire d'événement ou `useEffect`, pas dans le corps du composant (`16-fetch-promesses-useeffect.md`) | `architecture.md` : `services/` « Appels HTTP ; vérifient le statut et valident le JSON avec un type guard » | Partielle | L'endroit d'appel de `fetch` n'est pas dit. Les appels sont centralisés dans `services/`. |
| (B) Vérifier `response.ok` après un `fetch` (`16`) | `architecture.md` : les services « vérifient le statut » | Oui | — |
| (A) Dépendances de `useEffect` et fonction de nettoyage (`16`, Fonctionnement) | `architecture.md` : « `useCompanies.ts` (délai de frappe, annulation) » | Partielle | Le nettoyage est illustré par un exemple, pas formulé. Les dépendances sont contrôlées par le lint (`react/exhaustive-deps`, `frontend/.oxlintrc.json`), pas par un guide. |
| (A) Un proxy Vite transmet `/api` ; (B) `rewrite` retire `/api` (`18-single-origin-policy-proxy.md`) | `copilot-instructions.md` : « Vite serves it on port 5173 and proxies `/api/...` to the backend on port 3000 while removing the `/api` prefix. » | Oui | **Vérifié** dans `frontend/vite.config.ts`. |
| (A) CORS comme alternative au proxy (`18`) | Aucun passage | Sans objet | Le projet a choisi le proxy, l'une des deux solutions du cours. |

### Ce qui correspond

L'architecture serveur et le rôle des middlewares, la validation par type guards, le contrôle des droits côté backend, le contenu minimal du jeton, les codes 401 et 403, l'en-tête `Authorization`, la vérification du statut des appels HTTP et le proxy Vite sont cohérents avec Web 2. Aucune contradiction directe n'a été trouvée. L'écart le plus net est volontaire : la connexion de démonstration n'a pas de mot de passe, alors que Web 2 enseigne `/login` avec identifiants. Le `README` l'annonce : « Ce n'est **pas** une authentification ».

### Ce qui manque ou ne correspond pas

- **Codes de statut.** Les guides ne disent pas quand utiliser chaque code. Le code renvoie 400 pour un doublon, là où Web 2 (`04-REST.md`) donne 409 pour une ressource déjà existante.
- **Annotation des types.** L'obligation de Web 2 n'est ni dans un guide ni dans une règle de lint.
- **Origine de MVVM.** Le guide l'attribue au cours, mais aucune fiche fournie n'en parle.
- **React.** `fetch`, `useEffect` (dépendances, nettoyage), formulaires, clés de liste et routage sont peu ou pas décrits.
- **Secret et durée du JWT.** Ni la consigne de ne pas versionner le secret ni la durée de vie du jeton ne sont écrites.

### Un guide qui n'est plus à jour

Le commit de la semaine 1 (`78be497`) a réécrit le `README` : « Offres : cycle complet de gestion selon le profil ». Pourtant la section « Ce qui n'est pas implémenté » liste toujours la création d'une offre par un déposant, la validation par un administrateur et « recherche et filtrage des offres (année, période, statut…) ». Le filtre par période existe, mais le mot « période » ne figure nulle part dans le `README`. Un guide lu par l'agent peut donc l'induire en erreur, et aucun contrôle ne le détecte.

### Écart entre le code et les guides

Les guides décrivent `pages → hooks → services`. **Vérifié** : `OffersPage.tsx` importe `createApplication` directement depuis le service et gère l'état d'envoi dans la page. Ce n'est pas un écart avec Web 2, mais avec le guide du projet.

### Instruction ou contrôle ?

Peu de règles de Web 2 reprises par les guides sont contrôlées par un outil. `tsc` en mode strict, `no-explicit-any` et `react/exhaustive-deps` en font partie, ainsi que `errorHandler` à l'exécution. Le découpage en couches, l'usage des codes de statut, la vérification du statut des appels `fetch` et les conventions React restent de simples instructions.

### Recommandations

1. **Codes de statut** : ajouter à `copilot-instructions.md` une règle (400 entrée invalide, 404 introuvable, 409 conflit). Justification : `04-REST.md` ; le code renvoie 400 pour un doublon. Les tests attendent actuellement 400, donc la changer pour le code existant demande de mettre à jour l'API et les tests.
2. **Types explicites** : écrire la règle d'annotation de `02-typescript.md` dans le guide, ou ajouter une règle de lint équivalente (à vérifier dans Oxlint). Cela la transformerait en contrôle.
3. **Couches frontend** : ajouter « les pages n'appellent pas les services directement, elles passent par un hook », et préciser où appeler `fetch`. Justification : `16-fetch-promesses-useeffect.md` et l'écart de `OffersPage.tsx`.
4. **MVVM** : retrouver la source dans le cours ou retirer « du cours » des deux guides.
5. **README** : le remettre à jour et ajouter à la checklist de PR « le README reflète les fonctionnalités réellement présentes ».
6. **JWT** : écrire que le secret n'est jamais versionné et préciser la durée de vie du jeton (`19-json-web-tokens.md`).
7. **Priorité faible** : conventions React (clés de liste, formulaires contrôlés, `preventDefault`), Link/useNavigate/Outlet, quand utiliser le Context.

### Consignes des guides sans équivalent dans les fiches

Ces éléments ne sont pas rattachés à Web 2 : tests (Vitest, Supertest, Testing Library), `npm run check`, lint Oxlint, migrations SQL, architecture `repositories` et `mappers`, synchronisation de `backend/API.md` et des fichiers `.http`, utilisation de `API_PORT`, checklist de PR et suivi des séances.

### Limites de l'analyse

- Seuls quatre fichiers de consignes ont été audités. `docs/seed.md` et `backend/API.md` ne l'ont pas été.

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