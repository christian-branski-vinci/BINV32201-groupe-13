# Bilan — semaine 5 : MCP et tests end-to-end avec Playwright

## Contexte

La séance porte sur MCP et sur les tests end-to-end (E2E) avec Playwright, appliqués à la recherche d'offres par titre (EF-30), développée en semaine 4 avec le TDD. Un test E2E passe par l'interface et vérifie l'application dans son ensemble, contrairement aux tests d'API et de composants des semaines précédentes.

Répartition d'après l'historique git : scénarios (`0bd5deb` par Christian, puis remplacement du cas limite `baae39c` par Georgios), configuration MCP (`bb4b6c6`, Georgios), tests Playwright (`112cda4`, Selin). La vérification de la qualité des tests (défaut volontaire), la comparaison, ce bilan et le bilan global ont été faits par Georgios.

## 1. Scénarios

Fichier : [`e2e/recherche-offres/scenarios.md`](../../e2e/recherche-offres/scenarios.md). Les scénarios ont été écrits et committés **avant** les tests (`0bd5deb` et `baae39c`, puis `112cda4`).

| N° | Cas | Compte et données | Action | Résultat attendu |
|---|---|---|---|---|
| 1 | Nominal | Étudiant Lucas Dupont ; offres publiées « Application React de gestion de flotte » et « API REST de facturation », offre « Migration d'une application vers le cloud » non publiée | Saisir `APPLICATION` avec majuscules et espaces autour | Une seule offre : « Application React de gestion de flotte » ; ni la migration (non publiée) ni l'API REST ; pas de message d'absence de résultat |
| 2 | Limite (visibilité) | Même étudiant ; offre « Refonte du portail client » au statut « Soumise » (non publiée) | Saisir `refonte` | Message « Aucune offre ne correspond à la recherche. », aucune ligne, ni erreur ni indicateur de chargement, le champ garde `refonte` |

**Justification du choix.** Les deux cas reprennent des essais faits à la main en semaine 4 (`docs/semaine-4/bilan.md`, section 4). Le scénario 1 couvre le comportement courant (recherche par sous-chaîne, casse et espaces ignorés) et sa combinaison avec la visibilité du profil. Le scénario 2 est un cas limite plus risqué qu'une recherche au hasard : l'offre existe, le titre contient le mot, mais l'offre n'est pas publiée. Une recherche qui contournerait le filtre de visibilité la révélerait à un étudiant. Il reste une recherche sans résultat, comme l'exemple de l'énoncé. Les deux scénarios sont en lecture seule : ils ne modifient aucune donnée.

## 2. Playwright MCP

**Non réalisé.** Nous avons ajouté `.mcp.json` à la racine (`bb4b6c6`, serveur HTTP `http://localhost:8931/mcp`, lancé avec `npx -y @playwright/mcp@latest --isolated --port 8931`), mais la connexion de l'agent au serveur n'a pas fonctionné ; cause non identifiée.
Conséquences, sans les masquer :

- aucun scénario n'a été exécuté via MCP ; il n'y a donc pas d'appels d'outils observés (`browser_navigate`, `browser_snapshot`, etc.) à présenter ;
- la réponse à la question 1 de la comparaison repose sur le cours (diapositives MCP) et non sur une observation ;
- les deux scénarios n'ont donc pas été comparés entre exploration par l'agent et test automatisé.

## 3. Playwright Test

**Fichiers créés ou modifiés** (`112cda4`) : `playwright.config.ts` (répertoire des tests `./e2e`, `baseURL` `http://localhost:5173`, démarrage automatique du backend et du frontend), `e2e/recherche-offres/recherche-offres.spec.ts`, `package.json` (`@playwright/test`), `.gitignore`. Deux fichiers générés par `npm init playwright` ont été **supprimés** : `e2e/example.spec.ts` (exemple qui visite playwright.dev, hors de nos scénarios) et `.github/workflows/playwright.yml` (CI non demandée par l'énoncé, qui lançait l'exemple sur trois navigateurs avec `npm ci`).

**Principales assertions** (`recherche-offres.spec.ts`, connexion par l'interface avec Lucas Dupont avant chaque test) :

- *Scénario 1* : après `  APPLICATION  `, le tableau contient exactement 1 ligne (`toHaveCount(1)`), la cellule « Application React de gestion de flotte » est visible, les cellules « Migration d'une application vers le cloud » et « API REST de facturation » sont absentes, et le message d'absence de résultat n'est pas affiché.
- *Scénario 2* : avant la recherche, « Refonte du portail client » est absente et toutes les cellules de statut valent « Publiée » (autant que de lignes) ; après `refonte`, le message « Aucune offre ne correspond à la recherche. » est visible, le tableau a 0 ligne, le champ contient toujours `refonte`, et aucun `alert` ni `status` (erreur ou chargement) n'est affiché.

Les sélecteurs passent par les rôles et libellés accessibles (`getByRole`, champ « Rechercher par titre »). Aucune attente fixe : les assertions de Playwright attendent le résultat, ce qui absorbe le délai de saisie de 300 ms.

**Exécutions** (base recréée avec `npm run db:reset` avant la première, Chromium) :

| Exécution | Commande | Résultat |
|---|---|---|
| Copilot (conversation 5) | `npx playwright test e2e/recherche-offres/... --project=chromium --workers=2` | 2 tests réussis en 2,6 s, aucun code applicatif modifié |
| Notre exécution 1 | `npx playwright test e2e/recherche-offres --project=chromium --reporter=line` | 2 tests lancés sur 2 workers, `2 passed (18.5s)` |
| Notre exécution 2 | même commande, sans toucher à la base | `2 passed (15.9s)` |
| `npm run check` | lint, typecheck, tests backend et frontend, builds | lint : 0 avertissement, 0 erreur (backend et frontend) ; typecheck sans erreur ; 152 tests backend et 54 tests frontend réussis (comme en semaine 4) ; builds backend et frontend réussis |

Une toute première tentative de lancement, juste après `npm run db:reset`, a été interrompue à la main (Ctrl+C) et a affiché `Error: Process from config.webServer was not able to start. Exit code: 1` ; nous ne l'avons pas analysée et le relancement identique a réussi. Avant les exécutions ci-dessus, le dépôt a été remis en état : `package-lock.json` restauré depuis `main` puis `npm install` (6 paquets ajoutés, 442 lignes ajoutées au verrou, aucune supprimée), et `npx playwright install chromium`.

`npm run check` ne lance pas les tests E2E (scripts `lint`, `typecheck`, `test --workspaces`, `build`) : ils se lancent explicitement avec `npx playwright test`. Les tests dépendent du jeu de données de démonstration non modifié ; la configuration ne recrée pas la base.

## 4. Vérification : le test détecte-t-il un défaut ?

| Étape | Résultat |
|---|---|
| Avant le défaut | `git diff -- backend\src\services\offers.service.ts` vide, puis `2 passed (14.7s)` |
| Défaut introduit (temporairement) | Dans `backend/src/services/offers.service.ts` (ligne 33), `listOffers` ignore le terme de recherche : `search` remplacé par `search: undefined` dans l'appel à `repository.findAll`. Le `git diff` du fichier montrait uniquement ce changement d'une ligne (vérifié après coup). |
| Tests avec le défaut | `2 failed`. Scénario 1 : `expect(locator).toHaveCount(expected) failed`, `Expected: 1`, `Received: 4` (ligne 25 du fichier de tests). Scénario 2 : `expect(locator).toBeVisible() failed`, message « Aucune offre ne correspond à la recherche. » introuvable (`element(s) not found`, ligne 69). |
| Cause de l'échec | Les deux échecs sont des assertions sur le résultat de la recherche, pas des erreurs de configuration ou de connexion : la connexion et la navigation de `beforeEach` (lignes 3 à 13) ont réussi, et dans le scénario 2 les vérifications de départ (lignes 49 à 59) aussi. Avec 4 lignes au lieu de 1, la liste n'est pas filtrée : le terme saisi est ignoré. |
| Après restauration (`git restore` du seul fichier) | `git restore backend\src\services\offers.service.ts`, puis `2 passed (15.6s)` |
| Défaut absent du diff | `git diff --stat -- backend` ne renvoie rien après la restauration |

## 5. Comparaison

1. **Que permet Playwright MCP, et quelle action précise a-t-on vue ?** MCP rend les actions d'un navigateur (navigation, clic, saisie, lecture de l'état de la page) disponibles à l'agent sous forme d'outils qu'il découvre, choisit et appelle ; le résultat revient dans son contexte (par exemple `browser_navigate` avec une URL, qui renvoie l'état de la page). **Nous n'avons observé aucun appel**, car la connexion n'a pas fonctionné (section 2).
2. **Qu'apportent les scripts Playwright Test que le compte rendu MCP n'apporte pas ?** Ils sont versionnés et rejouables sans agent (CI, régression) ; leurs assertions sont explicites, donc l'échec indique ce qui est attendu et ce qui est reçu ; ils donnent le même verdict à chaque exécution, alors qu'un compte rendu d'agent est une affirmation interprétée qu'il faut contrôler à la main (semaine 2 : l'agent annonçait un test inexistant).
3. **Quand préférer chaque approche ?** MCP pour explorer une fonctionnalité nouvelle ou un comportement mal compris, vérifier vite un parcours et repérer les sélecteurs avant d'écrire un test. Le test automatisé pour ce qui doit rester vrai : régressions, règles critiques comme la visibilité des offres, exécution en CI. Les deux sont complémentaires : explorer, puis figer ce qu'on a compris dans un test.

## 6. Réflexion (appris, bien, moins bien)

- **Appris.** Un test E2E vérifie des règles que les tests unitaires ne voient pas, comme le fait que la recherche respecte la visibilité vue par l'utilisateur, mais il dépend des données et de l'environnement. Un test n'a de valeur que s'il a échoué au moins une fois à cause d'un vrai défaut.
- **A bien fonctionné.** Scénarios écrits avant les tests, avec état initial et résultat observable précis ; sélecteurs par rôle ; scénarios en lecture seule, donc répétables ; vérification du test par un défaut volontaire, ce qui n'avait pas été fait aux semaines 3 et 4.
- **A moins bien fonctionné.** La connexion MCP n'a jamais fonctionné, donc la moitié « exploration par l'agent » de l'énoncé n'a pas été faite. L'environnement a coûté du temps : navigateur Playwright installé dans un cache isolé (conversation 5) ; `package-lock.json` avait perdu les entrées `@esbuild/*` des plateformes (`npm ci` aurait supprimé le binaire Windows et cassé `tsx`), et `@playwright/test` n'était pas installé localement (`npm ls` : UNMET), ce que nous avons réparé en restaurant le verrou depuis `main` puis `npm install` ; `npm init playwright` avait généré un exemple et un workflow CI non demandés ; une première exécution a échoué sur le démarrage du `webServer` sans explication. `npm install` signale aussi une vulnérabilité de gravité élevée, que nous n'avons pas examinée.

## Crédits IA consommés

| Personne | Début du projet | Fin |
|---|---|---|
| Georgios | 0 | 54,2 |
| Selin | 0 | 16,4 (≈ 8 %) |
| Christian | 0 | 34 |

## Limites

- Partie MCP non exécutée : aucune comparaison réelle entre exploration par l'agent et test automatisé.
- Deux scénarios seulement, sur un seul profil (étudiant). L'administrateur et le déposant ne sont pas couverts en E2E.
- Tests lancés uniquement en Chromium (`--project=chromium`). La configuration déclare aussi Firefox et WebKit, mais seul Chromium est installé sur notre poste (`npx playwright install chromium` a même supprimé les anciens Firefox et WebKit).
- Un seul défaut a été introduit : il prouve que les tests détectent l'absence de recherche, pas qu'ils détecteraient une fuite de visibilité (dans `visibilityFilter`). Nous n'avons pas essayé ce second défaut.
- Les tests supposent la base de démonstration non modifiée.
- `npm run check` ne couvre pas les tests E2E.

## Conversations

- `conversation-5.md` : Copilot (export « Copy All » de Selin), configuration de Playwright et génération des tests.
