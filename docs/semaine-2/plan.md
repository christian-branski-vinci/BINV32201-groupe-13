# Plan d’implémentation EF-32 / EF-33

## Problème et approche

Le schéma SQLite contient déjà la table `applications` et les codes `IN_PROGRESS`,
`SELECTED`, `REJECTED` et `WITHDRAWN`, mais aucune route, couche métier ou interface
ne permet encore à un étudiant de candidater, consulter ses candidatures ou les retirer.
L’implémentation suivra l’architecture existante
`controller -> service -> repository -> SQLite` et
`page -> hook -> service -> composants` sans traiter EF-30, EF-31, EF-34, la sélection
d’un candidat ni la création du stage.

## Décisions métier retenues

- Une candidature ne peut viser qu’une offre `PUBLISHED`.
- Un doublon actif (même étudiant, même offre, statut différent de `WITHDRAWN`) est
  refusé avec une erreur métier explicite.
- Après un retrait, l’étudiant peut recandidater : une nouvelle ligne est créée et
  l’historique de la ligne retirée est conservé.
- Le message est facultatif, trimé, et limité à 2000 caractères ; une chaîne vide est
  normalisée en `null`.
- La consultation est filtrée par défaut sur l’année académique courante, conformément
  à EF-72.
- Le retrait est possible pour une candidature `IN_PROGRESS` et, selon la décision
  métier confirmée, également pour `SELECTED`. Dans ce dernier cas la candidature
  devient `WITHDRAWN`, sans remplacement automatique, sans changement automatique de
  l’offre et sans implémentation d’EF-34.
- Les candidatures `REJECTED` et `WITHDRAWN` ne sont pas retirables.
- L’étudiant connecté est toujours la source de `student_id` ; il ne vient jamais du
  corps de la requête.

## Trois étapes

### 1. Candidater à une offre

**Backend**

- Ajouter une migration `002_applications_rules.sql` si nécessaire pour les contraintes
  structurelles compatibles avec l’historique ; ne pas imposer une unicité globale qui
  empêcherait la nouvelle candidature après retrait.
- Ajouter `backend/src/models/application.ts` et son mapper pour les DBO, l’objet métier
  et le DTO.
- Ajouter `backend/src/repositories/applications.repository.ts` pour vérifier une
  candidature active, insérer une candidature et relire son DTO enrichi avec l’offre,
  l’entreprise, l’année et la période.
- Ajouter `backend/src/services/applications.service.ts` avec contrôle étudiant,
  existence/visibilité de l’offre, statut `PUBLISHED`, détection de doublon actif et
  validation du message.
- Ajouter `backend/src/controllers/applications.controller.ts`, avec
  `POST /applications` et validation stricte du corps (`offerId`, `message` facultatif).
- Brancher le repository/service/router dans `backend/src/app.ts`.
- Documenter la route dans `backend/API.md` et ajouter une requête de démonstration
  dans `backend/http/applications.http`.

**Frontend**

- Étendre le modèle, le service et les guards des candidatures.
- Ajouter un formulaire/modal ou panneau de candidature depuis la liste des offres ;
  le bouton « Candidater » sera visible pour les étudiants uniquement.
- Afficher les erreurs métier (offre non publiée, doublon actif, message trop long) et
  rafraîchir l’état après succès.

**Vérifications/tests**

- Tests API : absence de session, refus des profils non étudiants, offre publiée
  acceptée, offre non publiée refusée, message absent/trimé, message > 2000 refusé,
  student id non forgeable, doublon actif refusé.
- Test frontend : bouton et formulaire étudiant, envoi du message, succès et erreurs.

### 2. Consulter ses candidatures

**Backend**

- Ajouter `GET /applications` limité à l’étudiant connecté, avec filtre par défaut sur
  l’année courante récupérée depuis la base.
- Retourner les informations nécessaires à EF-33 : identifiant, offre, entreprise,
  année/période, date de candidature, message éventuellement utile, et code de statut.
- Garantir qu’un étudiant ne voit jamais les candidatures d’un autre étudiant.
- Prévoir un tri déterministe (année/période puis date décroissante) et expliciter le
  filtre d’année dans l’API.

**Frontend**

- Ajouter `frontend/src/pages/ApplicationsPage.tsx`, le hook/service associés, les
  types/guards, et un composant de tableau ou de cartes.
- Ajouter une route et un lien « Mes candidatures » visibles pour un étudiant.
- Mapper les codes vers les libellés exigés : « En cours », « Retenue », « Non retenue »,
  « Retirée ».
- Afficher les états chargement, vide, erreur et session expirée selon les composants
  existants.

**Vérifications/tests**

- Tests API : périmètre étudiant, filtre année courante, présence des quatre statuts,
  conservation de l’historique après retrait et absence de fuite inter-utilisateurs.
- Tests frontend : libellés français, liste vide, erreur API, déconnexion sur 401 et
  navigation étudiant.

### 3. Retirer une candidature

**Backend**

- Ajouter `DELETE /applications/:id` (ou l’action HTTP équivalente conforme aux
  conventions retenues) avec parsing strict de l’identifiant.
- Vérifier la propriété par l’étudiant connecté et les statuts autorisés :
  `IN_PROGRESS` et `SELECTED`.
- Effectuer une transition atomique vers `WITHDRAWN`, sans supprimer la ligne.
- Retourner une erreur explicite pour candidature inconnue, candidature d’un autre
  étudiant ou statut `REJECTED`/`WITHDRAWN`.

**Frontend**

- Ajouter l’action « Retirer » pour les candidatures retirables, avec confirmation,
  état pendant la requête et mise à jour de la liste.
- Ne pas afficher d’action de retrait pour « Non retenue » ou « Retirée ».
- Afficher clairement le statut « Retirée » après succès ; pour « Retenue », préciser
  qu’aucun remplacement automatique n’est géré dans ce périmètre.

**Vérifications/tests**

- Tests API : retrait `IN_PROGRESS`, retrait `SELECTED` selon la décision retenue,
  refus `REJECTED`/`WITHDRAWN`, contrôle de propriété, id invalide, persistance de la
  ligne et possibilité de recandidater ensuite.
- Tests frontend : confirmation, succès, erreur et masquage conditionnel du bouton.

## Fichiers probablement concernés

- Backend : `src/app.ts`, `src/controllers/applications.controller.ts`,
  `src/services/applications.service.ts`, `src/repositories/applications.repository.ts`,
  `src/models/application.ts`, `src/mappers/application.mapper.ts`,
  `src/services/permissions.ts`, `src/db/migrations/002_*.sql`,
  `tests/applications.test.ts`, `tests/db/constraints.test.ts`, `API.md`,
  `http/applications.http`.
- Frontend : `src/App.tsx`, `src/components/NavBar.tsx`, `src/pages/OffersPage.tsx`,
  `src/pages/ApplicationsPage.tsx`, composants candidature/liste,
  `src/hooks/useApplications.ts`, `src/services/applications.service.ts`,
  `src/models/application.ts`, `src/utils/guards.ts`, `src/utils/labels.ts`,
  tests des pages, de la navigation et des guards.
- Documentation éventuellement mise à jour : `README.md`, `docs/architecture.md`,
  `docs/seed.md` si les données de démonstration sont enrichies.

## Validation globale

- Tester sur la base SQLite en mémoire via les helpers existants, sans utiliser la base
  de développement.
- Exécuter les tests backend/frontend ciblés, puis `npm run check` avant livraison.
- Vérifier manuellement le parcours avec les utilisateurs de démonstration existants :
  étudiant avec candidatures, étudiant sans candidature, et utilisateur non étudiant.
