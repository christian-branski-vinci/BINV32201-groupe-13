# Conversation — Implémentation des candidatures

## 1. Demande initiale

Le besoin concernait l’implémentation des fonctionnalités suivantes du cahier des
charges :

- **EF-32** : permettre à un étudiant de candidater à une offre publiée avec un
  message facultatif et de retirer sa candidature.
- **EF-33** : permettre à un étudiant de consulter ses candidatures et leur statut.

Le périmètre exclu était :

- EF-30 et EF-31 ;
- la sélection d’un candidat ;
- la création du stage.

Le bouton **Candidater** devait pouvoir être placé dans la liste des offres.

## 2. Analyse du code existant

L’application est composée de :

- un backend Express/TypeScript ;
- un frontend React/TypeScript ;
- une base SQLite ;
- des connexions et utilisateurs de démonstration.

Le schéma contenait déjà la table `applications` avec les statuts :

- `IN_PROGRESS` ;
- `SELECTED` ;
- `REJECTED` ;
- `WITHDRAWN`.

Cependant, aucune route, aucun service et aucune interface ne permettaient encore de
gérer les candidatures.

## 3. Décisions métier clarifiées

Les règles suivantes ont été retenues :

1. Une candidature ne peut viser qu’une offre publiée.
2. Une candidature active en double est refusée.
3. Après un retrait, l’étudiant peut candidater à nouveau à la même offre.
4. Une nouvelle ligne est créée lors de la nouvelle candidature afin de conserver
   l’historique.
5. Le message est facultatif, trimé et limité à 2000 caractères.
6. La liste des candidatures est limitée par défaut à l’année académique courante.
7. Une candidature `IN_PROGRESS` ou `SELECTED` peut être retirée.
8. Le retrait d’une candidature retenue ne déclenche aucun remplacement automatique
   et ne rouvre pas automatiquement l’offre.
9. Les candidatures `REJECTED` et `WITHDRAWN` ne peuvent pas être retirées.

## 4. Plan approuvé

### Étape 1 — Candidater à une offre

- Ajouter les modèles, mapper, repository, service et contrôleur backend.
- Ajouter `POST /applications`.
- Vérifier le profil étudiant, le statut de l’offre et les doublons.
- Ajouter le formulaire de candidature depuis la liste des offres.

### Étape 2 — Consulter ses candidatures

- Ajouter `GET /applications`.
- Limiter les résultats à l’étudiant connecté.
- Filtrer sur l’année académique courante.
- Ajouter une page **Mes candidatures** avec les statuts en français.

### Étape 3 — Retirer une candidature

- Ajouter `DELETE /applications/:id`.
- Vérifier la propriété de la candidature.
- Transformer la candidature en `WITHDRAWN` sans supprimer la ligne.
- Permettre ensuite une nouvelle candidature.

## 5. Implémentation réalisée

### Backend

Ajouts principaux :

- modèles et mapper des candidatures ;
- repository SQLite ;
- service métier ;
- contrôleur `/applications` ;
- branchement des routes dans l’application ;
- tests API ;
- documentation API ;
- requêtes REST Client de démonstration.

Routes ajoutées :

- `GET /applications` ;
- `POST /applications` ;
- `DELETE /applications/:id`.

### Frontend

Ajouts principaux :

- modèle, service et guards des candidatures ;
- hook `useApplications` ;
- page **Mes candidatures** ;
- tableau des candidatures ;
- bouton **Candidater** dans la liste des offres ;
- formulaire avec message facultatif ;
- bouton **Retirer** selon le statut ;
- navigation dédiée aux étudiants ;
- libellés français des statuts.

### Documentation

Documentation mise à jour :

- `backend/API.md` ;
- `docs/architecture.md` ;
- `README.md`.

## 6. Tests et validations

La commande globale suivante a été exécutée avec succès :

```bash
npm run check
```

Résultats :

- lint backend et frontend : réussi ;
- vérification TypeScript backend et frontend : réussie ;
- tests backend : **124 tests réussis** ;
- tests frontend : **46 tests réussis** ;
- build backend et frontend : réussi.

Les tests ajoutés couvrent notamment :

- la consultation limitée à l’étudiant connecté ;
- la création d’une candidature ;
- la normalisation du message ;
- le refus des doublons actifs ;
- le refus des offres non publiées ;
- le retrait d’une candidature ;
- la conservation de l’historique ;
- la nouvelle candidature après retrait ;
- le contrôle de propriété ;
- le refus du retrait d’une candidature non retenue.
