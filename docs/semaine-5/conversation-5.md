# Conversation 5 — Configuration Playwright et recherche d’offres

## Échange 1 — URL de base et démarrage des serveurs

**Utilisateur :**

> Est-ce que tu peux configurer baseURL et, si c’est adapté au projet, webServer pour démarrer automatiquement le frontend. Assure toi aussi que le backend est démarré et que les données nécessaires sont disponibles.

**Copilot :**

J’ai vérifié la configuration Playwright, les scripts du dépôt et le démarrage du backend. Le projet utilise le frontend Vite sur le port 5173 et le backend sur le port 3000. Le backend applique les migrations et insère les données de démo si la base est vide.

Comme le changement porte uniquement sur de la configuration, j’ai demandé l’accord pour l’exception TDD prévue par les consignes du projet. L’utilisateur a donné son accord.

Dans [`playwright.config.ts`](../../playwright.config.ts), j’ai configuré :

- `baseURL` à `http://localhost:5173` ;
- un `webServer` backend qui exécute `npm run setup`, puis démarre le backend et attend `/health` sur le port 3000 ;
- un `webServer` frontend qui démarre Vite et attend le port 5173 ;
- la réutilisation des serveurs déjà disponibles hors CI.

`npm run setup` conserve le fichier `backend/.env` s’il existe et initialise la base sans supprimer les données existantes.

**Vérifications :**

- `npx playwright test --list` : configuration chargée, six tests détectés dans l’exemple Playwright présent.
- `npm run setup` : après restauration d’une dépendance optionnelle esbuild Windows manquante dans `node_modules`, l’initialisation a réussi. Les données de démo étaient déjà présentes.
- Vérification HTTP : frontend, santé du backend et endpoint des utilisateurs de démo ont répondu `200`.
- Les tests navigateur n’ont pas été exécutés à cette étape, les binaires Playwright n’étant pas disponibles dans le cache de cet environnement.

Les autres changements non commités présents dans le dépôt ont été préservés.

## Échange 2 — Tests des scénarios de recherche d’offres

**Utilisateur :**

> À partir des scénarios 1 et 2 de e2e/recherche-offres/scenarios.md, génère des tests end-to-end avec Playwright Test et TypeScript dans e2e/recherche-offres/recherche-offres.spec.ts.  
> Indique le numéro du scénario dans le nom de chaque test.  
> N'utilise pas MCP : produis des fichiers de test classiques.  
> Les tests doivent passer par l'interface utilisateur, vérifier les résultats avec des assertions explicites et utiliser des sélecteurs robustes. Prévois des données de test maîtrisées pour que les tests soient répétables et ne dépendent pas de leur ordre d'exécution.  
> Exécute les tests. Si un test échoue, explique d'abord si le problème vient du test, de sa configuration ou de l'application. Ne modifie pas le code applicatif sans mon accord.

**Copilot :**

J’ai consulté les deux scénarios, les écrans de connexion et des offres, les sélecteurs accessibles et le jeu de données décrit dans [`docs/seed.md`](../seed.md). J’ai créé [`recherche-offres.spec.ts`](../../e2e/recherche-offres/recherche-offres.spec.ts). Les deux tests se connectent via l’interface avec le compte étudiant de démonstration de Lucas, ouvrent la page des offres et n’écrivent pas dans la base.

- **Scénario 1** : saisit `  APPLICATION  `, attend exactement une ligne, vérifie le titre attendu et l’absence des deux titres non correspondants ainsi que du message d’absence de résultats.
- **Scénario 2** : vérifie que l’offre « Refonte du portail client » est absente avant la recherche et que toutes les offres visibles sont publiées ; après la recherche `refonte`, vérifie le message vide, l’absence de ligne, la conservation de la saisie et l’absence d’erreur ou d’indicateur de chargement.

Les premières tentatives n’ont pas atteint les assertions : le navigateur Chromium avait été installé dans un cache isolé différent de celui utilisé par le processus de test. C’était un problème d’environnement de test, pas un défaut des tests ou de l’application. Après installation dans un cache local au projet, la commande suivante a réussi :

```text
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
npx playwright install chromium
npx playwright test e2e/recherche-offres/recherche-offres.spec.ts --project=chromium --workers=2
```

**Résultat :** 2 tests réussis en Chromium (2,6 s), exécutés en parallèle. Ils ne dépendent donc pas de leur ordre d’exécution. Aucun code applicatif n’a été modifié.

Les tests supposent que la base contient le jeu de données de démo. Si la base locale a été modifiée, la réinitialiser avec `npm run db:reset` avant l’exécution, après avoir arrêté les serveurs.
