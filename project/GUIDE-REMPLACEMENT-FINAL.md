# MentorUADB — paquet complet final

Ce paquet regroupe les améliorations réalisées :

- landing page premium sur `/`;
- routage public/privé : visiteur -> inscription, connecté -> tableau de bord;
- catalogue académique UADB structuré UFR/Institut -> filière -> matière -> niveau;
- listes dépendantes à l'inscription;
- recherche de mentors limitée à la filière et aux matières pertinentes;
- mentors visibles uniquement après validation administrative;
- éligibilité mentor : niveau strictement supérieur à L1 (L2+);
- compte administrateur exclusif : `is_admin=true`, `is_mentor=false`, `is_mentore=false`;
- protection serveur contre l'auto-promotion en administrateur;
- protection des matières/disponibilités des mentors non validés;
- protection contre l'association d'une matière d'une autre filière;
- migrations historiques incluses, dont le seed corrigé des niveaux/filières;
- migration de hardening finale.

## Installation sur le projet existant

1. Faire une sauvegarde de votre ancien dossier.
2. Décompresser le ZIP et remplacer le contenu du dossier `project` par celui-ci.
3. Ne pas copier un ancien `.env` dans le nouveau paquet. Créer/mettre à jour `.env` avec les valeurs du projet Supabase UADB-Mentor.

Exemple :

```env
VITE_SUPABASE_URL=https://nioslyxasdwpmmreeqeo.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIQUE
```

4. Dans PowerShell, depuis le dossier `project` :

```powershell
npm install
supabase login
supabase link --project-ref nioslyxasdwpmmreeqeo
supabase migration list
supabase db push
npm run build
npm run dev
```

La migration finale ajoutée par ce paquet est :

`supabase/migrations/20260811120000_final_security_hardening.sql`

Elle est additive. Ne supprimez aucune migration précédente.

## Administrateur

Le serveur force tout profil administrateur à :

- `is_admin = true`
- `is_mentor = false`
- `is_mentore = false`
- `statut_validation = valide`

Un utilisateur normal ne peut pas s'auto-promouvoir administrateur via l'API ou le navigateur.

Si le compte admin existe déjà dans Supabase Auth, son profil est normalisé par la migration finale.

## Mentor

Un mentor doit avoir un niveau L2 ou supérieur. Une nouvelle candidature mentor reste `en_attente` jusqu'à validation par un administrateur.

Avant validation, il ne peut pas :

- ajouter de matières;
- publier des disponibilités;
- recevoir de nouvelles sessions;
- apparaître dans la recherche publique des mentors.

Après validation, il peut gérer son accompagnement dans les limites de sa filière.

## Catalogue

Le catalogue ne prétend pas inventer les matières manquantes. Les matières présentes sont celles documentées dans les sources UADB/IFOAD utilisées lors de la préparation. L'espace administrateur peut compléter le catalogue au besoin.
