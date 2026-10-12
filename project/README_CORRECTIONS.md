# UADB Mentor — version corrigée

## Corrections réalisées

### Sécurité Supabase
- Ajout de `public.is_admin()` en `SECURITY DEFINER` pour éviter les récursions RLS.
- Protection des champs sensibles du profil : `is_admin`, `statut_validation` et `numero_carte`.
- Un utilisateur ne peut plus s'auto-valider ou s'auto-promouvoir administrateur.
- Notifications : insertion limitée au destinataire lui-même ou à l'administrateur. Les Edge Functions utilisant `service_role` restent autorisées.
- Ressources : publication réservée aux mentors validés.
- Demandes : l'étudiant et le mentor doivent être des comptes validés et les participants doivent être différents.
- Recherche des mentors : seuls les mentors validés sont exposés.

### Workflow de mentorat
Ancien flux : `Étudiant -> création directe d'une session`

Nouveau flux : `Étudiant -> profil mentor -> demande de mentorat -> acceptation/refus -> planification d'une session`

La page `Demandes` permet maintenant :
- à l'étudiant de consulter ses demandes ;
- au mentor d'accepter/refuser ;
- à l'étudiant d'annuler une demande ;
- de consulter la difficulté, l'objectif, la fréquence, la durée et le mode.

### Matching
La page de recherche utilise maintenant l'Edge Function `mentor-matching` lorsqu'une matière est sélectionnée et classe les mentors selon leur score de compatibilité.

### UX
- Ajout de la route `/app/requests`.
- Ajout du menu `Demandes`.
- Mise à jour des statuts de session dans l'affichage.

## Migration Supabase

Appliquer :
`supabase/migrations/20260810190000_security_and_mentorat_workflow.sql`

Après migration, vérifier dans Supabase :
1. les policies RLS ;
2. la fonction `public.is_admin()` ;
3. la vue `public.v_mentors_public`.

## Variables d'environnement

Copier `.env.example` vers `.env` puis renseigner les valeurs Supabase.

Ne jamais ajouter `.env` au dépôt Git.

## Vérification

Le compilateur TypeScript (`tsc -b`) passe après les modifications.

Le build Vite complet n'a pas pu être finalisé dans l'environnement d'audit car le paquet natif `lightningcss` manquait dans les dépendances extraites. Sur la machine de développement, exécuter :

```bash
npm ci
npm run build
```
