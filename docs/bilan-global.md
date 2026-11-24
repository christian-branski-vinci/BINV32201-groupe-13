# Bilan global — ce que nous avons appris du projet

Cinq semaines de développement de Gesta avec un agent de codage : recherche et filtrage des offres, candidatures, harnais agentique, skills et TDD, puis tests end-to-end.

## Ce que nous avons appris

**1. Cadrer l'agent détermine tout le reste.** En semaine 1, une consigne vague a fait ajouter tout le CRUD des offres au lieu du filtre par période. Le second essai, avec un objectif, des fichiers nommés et un fichier d'instructions (`.github/copilot-instructions.md`), est resté dans le périmètre. En semaine 2, relire le plan avant de l'approuver a permis de vérifier que l'agent ne faisait pas plus que demandé.

**2. Il faut vérifier soi-même ; l'affirmation de l'agent ne suffit pas.**
- Semaine 1 : en lançant `npm run check` nous-mêmes, nous avons trouvé deux problèmes que l'agent n'avait pas vus (un avertissement de lint et un test cassé par un texte en double).
- Semaine 2 : l'agent annonçait avoir testé « message > 2000 refusé » alors qu'aucun test ne le vérifiait.
- Semaine 4 : nous avons reproduit nous-mêmes les tests rouges annoncés (9 backend, 4 frontend) en retirant temporairement le code de la recherche. Un `npm run check` complet a aussi révélé un échec de typage que les tests seuls ne voyaient pas.

**3. Un guide n'est qu'une instruction ; un senseur est un contrôle.** En semaine 3, nous avons classé les mécanismes du dépôt : presque toutes les règles de `copilot-instructions.md` étaient de simples instructions, contrôlées par rien. Seuls `tsc`, Oxlint, les tests et le build contrôlaient réellement. Nous avons aussi vu qu'un guide périmé induit l'agent en erreur (le `README` listait encore des fonctionnalités déjà faites) et proposé un senseur d'architecture.

**4. Les skills et le TDD changent la manière de travailler, mais les tests proposés se relisent.** Le skill TDD s'est déclenché de lui-même, et l'agent s'est arrêté pour validation avant d'implémenter. En relisant ses tests avant accord, nous avons trouvé trois faiblesses : une combinaison avec la période non prouvée, une assertion trop faible sur la recherche vide, et l'absence de test pour `%`.

**5. Exploration et automatisation sont deux outils distincts.** MCP rend un navigateur disponible comme outils pour l'agent, utile pour explorer. Les scripts Playwright figent ce qu'on a compris dans une vérification rejouable sans agent. Un test n'a de valeur que s'il échoue réellement quand le code est cassé : en semaine 5, nous avons introduit un défaut volontaire pour le montrer, ce que nous n'avions pas fait pour les tests des semaines 3 et 4. Résultat : avec la recherche désactivée dans le backend, les deux tests ont échoué sur leurs assertions (4 lignes reçues au lieu de 1 ; message d'absence de résultat introuvable), puis ont réussi après restauration.

**6. L'environnement fait partie du travail.** Sandbox qui bloque les commandes de l'agent (semaine 1), dépôt sur un disque exFAT où `npm ci` échoue (semaine 1), navigateur Playwright installé dans un cache isolé et dépendance optionnelle esbuild manquante (semaine 5). À chaque fois, il a fallu comprendre si le problème venait du code, du test ou de la configuration avant de corriger.

**7. Le coût se mesure, même grossièrement.** La semaine 1 a consommé 20 crédits, la séance TDD de la semaine 4 environ 17,7. La mesure reste approximative : le compteur affiche des crédits, pas des jetons.

## Ce que nous n'avons pas appris, mais aurions aimé apprendre

**1. MCP et son usage concret avec des outils comme Playwright.** Nous connaissons le principe (un hôte, un client et un serveur qui expose des outils à l'agent), mais seulement par le cours. Notre connexion à Playwright MCP n'a pas fonctionné et nous n'en avons pas identifié la cause ; nous n'avons donc jamais vu l'agent découvrir, choisir et appeler un outil, ni comparé son exploration avec nos tests. Par ricochet, nous n'avons pas pu juger ce que MCP apporte réellement à un projet comme Gesta, ni dans quels cas il vaut mieux qu'un script. Seule la moitié « Playwright Test » de la semaine 5 nous a servi concrètement : c'est elle qui a produit des tests rejouables et un défaut détecté.

**2. Les harnais agentiques, au-delà de la théorie.** La distinction entre guides (qui orientent l'agent) et senseurs (qui contrôlent son travail) nous a aidés à lire le dépôt et à repérer qu'une règle sans contrôle n'est qu'un souhait (semaine 3). En revanche, nous n'avons pas construit de harnais nous-mêmes : nous avons relu et adapté un fichier d'instructions et des skills fournis, sans écrire les nôtres ni mesurer leur effet, et nous n'avons pas réalisé le hook facultatif de la semaine 4. Notre harnais est donc resté peu approfondi : il nous a surtout servi de grille d'analyse, plus que d'outil que nous aurions conçu et amélioré.

Dans les deux cas, le manque n'est pas seulement de temps : comme les outils n'ont pas fonctionné comme prévu, nous avons peu vu comment ces notions aident vraiment à travailler sur un projet, et ce que nous en retenons reste plus théorique que pratique.

**Autres manques, plus modestes.**
- Éprouver systématiquement les tests par un défaut volontaire : seule la semaine 5 le fait ; les tests des semaines 3 et 4 (dont les tests 401/403) n'ont pas été vérifiés ainsi.
- Mettre en place une vraie chaîne CI : le workflow généré par Playwright n'était pas conçu pour notre projet et nous l'avons supprimé plutôt que de le faire fonctionner.
- Couvrir le frontend des candidatures et les validations backend : ces manques sont documentés (semaines 3 et 4) mais n'ont pas été comblés.
- Mesurer la consommation par tâche, plutôt qu'avec le compteur global de crédits.
