# MentorUADB — amélioration catalogue académique et validation des mentors

## Ce qui a été corrigé

- Un compte `is_admin=true` ne peut plus être `is_mentor` ni `is_mentore`.
- Un mentor doit avoir un niveau **L2 ou supérieur**.
- Une candidature mentor reste `en_attente` jusqu'à validation de l'administrateur.
- Un mentor non validé ne peut pas ajouter de matières ni de disponibilités.
- Un mentor non validé ne peut pas recevoir de sessions.
- La recherche de mentors n'affiche que les mentors validés et non administrateurs.
- Lors de l'inscription, l'étudiant choisit d'abord son **UFR/Institut**, puis une **filière de cette composante**, puis son niveau.
- La recherche de mentor limite automatiquement les matières à la filière de l'étudiant.
- Le trigger d'inscription enregistre maintenant UFR/filière/niveau/bio dans le profil.

## Catalogue UADB

La base contient les quatre composantes officielles : SATIC, SDD, ECOMIJ et ISFAR, ainsi que les principales formations/licences publiées sur le site UADB.

Le catalogue de matières préchargé contient uniquement des matières explicitement retrouvées dans les maquettes UADB ou la plateforme IFOAD. Le site UADB ne publie pas un catalogue unique, complet et machine-readable de toutes les UE/matières de toutes les années ; les matières non documentées ne sont donc pas inventées. L'administration peut compléter le catalogue depuis l'espace Admin.

## Mise à jour de Supabase

Le projet Supabase distant est déjà lié à `nioslyxasdwpmmreeqeo` dans votre environnement local.

Après remplacement du dossier du projet :

```powershell
npm install
supabase link --project-ref nioslyxasdwpmmreeqeo
supabase migration list
supabase db push
npm run build
```

La nouvelle migration est :

`supabase/migrations/20260811093000_academic_catalog_and_mentor_governance.sql`

Elle est additive et ne demande pas de supprimer les anciennes migrations.

## Après migration

1. Vérifier `Table Editor > ufrs`.
2. Vérifier `filieres` et `matieres`.
3. Vérifier que l'administrateur a `is_admin=true`, `is_mentor=false`, `is_mentore=false`.
4. Créer un étudiant L1 : il ne peut pas devenir mentor.
5. Créer un étudiant L2/L3/M1 avec rôle Mentor : son compte doit rester en attente.
6. Depuis Admin, valider le mentor.
7. Vérifier qu'après validation le mentor peut gérer matières/disponibilités et apparaît dans la recherche.
8. Vérifier qu'un étudiant ne voit dans la liste matière que les matières de sa filière.
