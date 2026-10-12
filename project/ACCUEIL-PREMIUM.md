# MentorUADB — accueil premium

Modifications apportées :

- La route `/` affiche désormais toujours la landing page, même lorsqu'un utilisateur est connecté.
- Pour un visiteur : les CTA principaux dirigent vers `/signup`.
- Pour un utilisateur connecté : les CTA principaux dirigent vers `/app`.
- `/login` et `/signup` restent protégées contre l'accès d'un utilisateur déjà connecté.
- Nouvelle landing page responsive et premium avec :
  - hero éditorial avec photos et cartes flottantes ;
  - statistiques ;
  - 6 fonctionnalités ;
  - parcours en 3 étapes ;
  - présentation des 4 composantes UADB ;
  - section sombre pour les sessions en ligne / présentiel ;
  - témoignages ;
  - CTA final ;
  - footer ;
  - menu mobile.

## Configuration Supabase

Le fichier `.env` n'est pas inclus dans l'archive afin de ne pas exposer de clé API. Copiez `.env.example` vers `.env` puis renseignez la clé publique du projet `UADB-Mentor`.


## Catalogue académique et gouvernance mentor (11/08/2026)

Le projet ajoute une hiérarchie `UFR -> filière -> matière -> niveau`, un filtrage de l'inscription par UFR/filière et un filtre de recherche des mentors par la filière de l'étudiant. Les mentors sont visibles uniquement après validation et si leur niveau est au moins L2. Un compte administrateur est automatiquement exclusif : il ne peut pas être mentor ou mentoré.

### Sources UADB utilisées
- https://uadb.edu.sn/ — présentation de l'université et ses quatre composantes.
- https://uadb.edu.sn/mot-du-recteur — structure officielle SATIC, SDD, ECOMIJ et ISFAR.
- https://uadb.edu.sn/ufr-et-instituts/sciences-appliquees-et-technologies-de-l-information-et-de-la-communication — formations SATIC.
- https://uadb.edu.sn/ufr-et-instituts/sante-et-developpement-durable — formations SDD.
- https://uadb.edu.sn/ufr-et-instituts/economie-management-et-ingenierie-juridique — formations ECOMIJ.
- https://uadb.edu.sn/ufr-et-instituts/institut-superieur-de-formation-agricole-et-rural — formations ISFAR.
- https://ifoad.uadb.edu.sn/mutualisation/?redirect=0 — cours publiés par UFR/niveau sur la plateforme IFOAD.

Le site officiel UADB ne fournit pas, sur une seule page machine-readable, le catalogue exhaustif de toutes les UE/matières de toutes les années et de toutes les formations. Le projet n'invente donc pas les matières manquantes : les matières explicitement documentées sont préchargées et l'administration peut compléter le catalogue.
