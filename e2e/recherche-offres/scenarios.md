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

scénario 2 (cas critique)

Recherche sans résultat
état initial:
Même jeu de données et même compte étudiant que le scénario 1, avec une session ouverte sur la page des offres, champ de recherche vide.
Avant d'agir, relever le nombre d'offres affichées, ajouté . Le test compte ces offres, sans valeur écrite en dur.

action d'interface: 
1) Saisir "xxxxxx" dans « Rechercher par titre ».
2) Attendre la fin de la recherche.
3) Effacer entièrement le champ.
4) Attendre le rechargement de la liste.


Résultat attendu:

après l'étape 2:
aucune carte ou ligne d'offre n'est affichée 
le message « Aucune offre ne correspond à la recherche. » est visible 
aucun message d'erreur ni indicateur de chargement ne reste affiché

après l'étape 4: 
le message d'absence de résultat a disparu 
la liste affiche de nouveau les N offres initiales, avec les mêmes titres qu'au départ.