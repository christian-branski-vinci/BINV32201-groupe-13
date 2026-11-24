scénario 1 (cas nominal):

Recherche par titre

état initial: 
Role: STUDENT pris du docs/seed.md
Recherche: interne
Offres de base: « Application React de gestion de flotte» (publiée) ;
« Migration d'une application vers le cloud » (non publiée) ;
« API REST de facturation » (publiée).

Action dans l'interface: 
1) Ouvrir l'application et se connecter avec le compte étudiant.
2) Aller sur la page des offres. Vérifier que le champ « Rechercher par titre » est visible.
3) Saisir APPLICATION (majuscules, espaces avant et après).
4) Attendre la fin du délai de saisie (300 ms) et de la requête. Dans le test, on attend le résultat affiché, pas un sleep.



Résultat attendu: 
La liste contient exactement une offre : « Application React de gestion de flotte ».
« Migration d'une application vers le cloud » n'apparaît pas, car l'offre n'est pas publiée, même si son titre contient le mot.
« API REST de facturation » n'apparaît pas.
Le message « Aucune offre ne correspond à la recherche. » n'est pas affiché.

scénario 2 (cas limite)

Recherche d'une offre non publiée
état initial:
Role: STUDENT (Lucas Dupont, pris du docs/seed.md), même compte que le scénario 1.
Offre cible : « Refonte du portail client » (Lumen Digital, statut « Soumise », donc non publiée). Elle existe bien dans la base : un résultat vide ne vient pas d'une donnée absente.
Offres visibles pour l'étudiant : uniquement les offres publiées (4 avec le jeu de données de base), sans l'offre cible.
Base recréée avec « npm run db:reset » avant l'exécution : le test ne modifie aucune donnée.

action d'interface:
1) Ouvrir l'application et se connecter avec le compte étudiant.
2) Aller sur la page des offres. Relever le nombre d'offres affichées et vérifier que « Refonte du portail client » n'y figure pas. Le test compte ces offres, sans valeur écrite en dur.
3) Saisir « refonte » dans « Rechercher par titre ».
4) Attendre la fin du délai de saisie (300 ms) et de la requête. Dans le test, on attend le message affiché, pas un sleep.

Résultat attendu:

avant la recherche (étape 2):
la liste affiche uniquement des offres publiées
« Refonte du portail client » n'apparaît pas

après l'étape 4:
le message « Aucune offre ne correspond à la recherche. » est visible
aucune ligne d'offre n'est affichée, et « Refonte du portail client » n'apparaît pas, car l'offre est « Soumise », même si son titre contient le mot
aucun message d'erreur ni indicateur de chargement ne reste affiché
le champ de recherche contient toujours « refonte »

remarque: avec un compte administrateur, la même recherche afficherait cette offre (les administrateurs voient tous les statuts). Ce contraste n'est pas vérifié dans ce scénario, qui reste sur un seul profil.
