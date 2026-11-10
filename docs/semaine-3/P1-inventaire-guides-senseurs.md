# Inventaire des guides et senseurs

## 1. Cadre d’analyse

Un **guide** agit en feedforward : il oriente ou contraint la production avant
son exécution.

Un **senseur** agit en feedback : il observe le code ou son comportement et
produit un retour.

Les mécanismes sont distingués selon leur nature :

- **Inférentielle** : interprétée par une IA ou un humain.
- **Computationnelle** : fondée sur des règles ou calculs exécutables.

L’analyse a porté sur le dépôt `BINV32201-groupe-13`, sans modification du code
applicatif.

## 2. Inventaire des guides inférentiels — feedforward

| Mécanisme | Fichier | Rôle et exemple concret | Statut |
|---|---|---|---|
| Instructions Copilot du dépôt | `.github/copilot-instructions.md` | Oriente l’IA : utiliser Node.js >= 22.14, lancer `npm run check`, ajouter une nouvelle migration SQL plutôt que modifier une migration appliquée. | Configuré ; non exécuté comme test autonome. |
| Documentation du projet | `README.md`, `docs/architecture.md` | Décrit les responsabilités et les flux, par exemple `controllers -> services -> repositories -> SQLite`. | Décrit seulement. |

## 3. Inventaire des guides computationnels — feedforward

| Mécanisme | Fichier ou outil | Rôle et exemple concret | Statut |
|---|---|---|---|
| Scripts npm | `package.json`, `backend/package.json`, `frontend/package.json` | Définit les commandes reproductibles : `lint`, `typecheck`, `test`, `build`, `setup` et migrations. | Exécuté avec succès via `npm run check`. |
| Configuration TypeScript | `backend/tsconfig.json`, `backend/tsconfig.build.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json` | Impose `strict`, `noUnusedLocals`, `noUncheckedIndexedAccess` et la cohérence des imports. | Vérifiée indirectement par le typecheck et le build. |
| Configuration Vite/Vitest | `frontend/vite.config.ts`, `backend/vitest.config.ts` | Configure le bundle, le proxy `/api`, l’environnement `jsdom` et les fichiers d’initialisation des tests. | Vérifiée par les tests et le build. |
| Copie des migrations | `backend/scripts/copyMigrations.js` | Copie `src/db/migrations` vers `dist/db/migrations` après compilation. | Exécutée pendant le build avec succès. |
| Politique VS Code/Copilot | `.vscode/settings.json` | Contrôle les permissions et approbations : par exemple, l’approbation globale est désactivée et les écritures hors workspace sont bloquées. | Configurée ; non testée seule dans la séance. |

## 4. Inventaire des senseurs computationnels — feedback

| Senseur | Fichier ou outil | Ce qu’il observe ou vérifie | Résultat dans la séance |
|---|---|---|---|
| Oxlint | Scripts `lint` des deux workspaces | Les erreurs et avertissements de code, avec `--deny-warnings`. | Réussi ; aucune erreur ni avertissement. |
| TypeScript | Scripts `typecheck` | La cohérence et le typage du backend et du frontend. | Réussi. |
| Tests backend | `backend/tests`, Vitest et Supertest | Le comportement HTTP, l’authentification, les permissions et la base SQLite en mémoire. | 10 fichiers et 133 tests passés. |
| Tests frontend | `frontend/tests`, Vitest et Testing Library | Le rendu et le comportement de l’interface React. | 7 fichiers et 50 tests passés. |
| Build backend/frontend | Scripts `build`, TypeScript et Vite | La capacité à compiler et produire les artefacts de déploiement. | Réussi. |

Exemples de vérifications :

- `backend/tests/health.test.ts` vérifie que `GET /health` renvoie
  `{ "status": "ok" }`.
- `frontend/tests/HomePage.test.tsx` vérifie l’affichage de
  `Gesta — API connectée`.

## 5. Senseurs inférentiels — feedback

Aucun mécanisme explicite de revue ou d’analyse par IA n’est versionné dans le
dépôt.

L’analyse réalisée pendant cette séance est une interprétation ponctuelle par
l’assistant ; elle ne constitue pas un senseur permanent du projet.

## 6. Matrice principale

|  | Guide — feedforward | Senseur — feedback |
|---|---|---|
| **Inférentiel** | `.github/copilot-instructions.md`, `README.md`, `docs/architecture.md` | Aucun mécanisme explicite trouvé dans le dépôt. |
| **Computationnel** | Scripts npm, configurations TypeScript/Vite/Vitest, script de copie des migrations, `.vscode/settings.json` | Oxlint, TypeScript, Vitest/Supertest/Testing Library et builds. |

## 7. Vérification globale

Commande exécutée :

```text
npm run check
```

Résultat :

- lint réussi ;
- typecheck réussi ;
- 133 tests backend passés ;
- 50 tests frontend passés ;
- builds backend et frontend réussis ;
- aucune modification du dépôt après la vérification.
