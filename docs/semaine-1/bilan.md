## Bilan

**Qu’ai-je appris ?** J’ai appris qu’il est essentiel de définir explicitement l’objectif et les fichiers concernés. Sans ces précisions, l’agent peut consacrer beaucoup de tokens à essayer de comprendre la demande, voire à explorer récursivement le projet.

**Qu’est-ce qui a bien fonctionné ?** Le contrôle qualité a été régulier et persistant. Plusieurs vérifications ont été nécessaires, mais les tests, le lint, le typage et le build ont finalement confirmé le bon fonctionnement de l’application.

**Qu’est-ce qui a moins bien fonctionné ?** La difficulté principale a été de formuler un objectif suffisamment clair, même si un README était déjà présent. L’agent a parfois dû interpréter le périmètre attendu au lieu de disposer dès le départ d’une consigne précise.

## Complément : reprise de la séance

1. **Qu’est-ce que Copilot m’a aidé à faire ?** Copilot a analysé le projet et créé le fichier `.github/copilot-instructions.md`. Il a ensuite ajouté le filtre de période dans le backend et le frontend, ainsi que les tests et la documentation associés.

2. **Qu'ai-je vérifié ou corrigé moi-même ?** J'ai installé les dépendances (`npm ci`, `npm run setup`) puis lancé `npm run check` moi-même : lint sans avertissement ni erreur, typecheck OK, 127 tests backend et 50 tests frontend réussis, build OK. Les vérifications de l'agent avaient été bloquées ; en lançant les miennes, j'ai trouvé deux problèmes qu'il n'avait pas vus : un avertissement de lint `set-state-in-effect` dans `useOffers.ts`, et un test cassé dans `OffersPage.test.tsx`, car « Autre » apparaissait deux fois (option du sélecteur et cellule du tableau). Le correctif du test limite la recherche au tableau avec `within`, sans affaiblir l'assertion. J'ai aussi testé dans le navigateur avec Anne Leclercq (administratrice) et Louis Claes (étudiant) les quatre choix du filtre : le passage de P1 à P2 puis à « Autre » affiche à chaque fois les offres correspondantes, « Toutes les périodes » rétablit la liste complète, et l'étudiant ne voit que des offres publiées, quel que soit le filtre.

3. **Quelle difficulté ou limite ai-je rencontrée ?** Le premier essai avait un périmètre trop large : la consigne était vague et le CRUD des offres a été ajouté au lieu du filtre par période, sans fichier d'instructions. Côté environnement, le sandbox a bloqué les commandes de l'agent (`AuthorizationManager check failed`), et le dépôt se trouvait sur un disque exFAT qui ne permet pas les liens symboliques nécessaires aux workspaces npm : `npm ci` échouait. J'ai donc déplacé le projet sur un disque NTFS. Limites restantes : le CRUD du premier essai présente des failles non corrigées (un déposant peut envoyer `status: "PUBLISHED"` et contourner la validation, aucun contrôle de propriété sur `depositorContactId`, aucune validation des transitions de statut), et `npm audit` signale 1 vulnérabilité de gravité élevée que je n'ai pas analysée.

4. **Combien de crédits IA ai-je consommés ?** 20 crédits consommés.
