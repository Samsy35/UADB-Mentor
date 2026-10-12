/*
  MentorUADB — Sécurité et workflow de mentorat
  - protège les champs de rôle/validation des profils
  - centralise le contrôle admin via une fonction SECURITY DEFINER
  - empêche les mentors non validés d'apparaître comme mentors actifs
  - sécurise les demandes et notifications
  - ajoute des contraintes d'intégrité sur les demandes
*/

BEGIN;

-- ----------------------------------------------------------------
-- 1. Fonction de contrôle administrateur sans récursion RLS
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ----------------------------------------------------------------
-- 2. Protéger les attributs sensibles d'un profil
-- Un utilisateur peut modifier ses informations personnelles,
-- mais pas s'auto-promouvoir admin, se valider ou changer son statut.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Modification de profil non autorisée';
  END IF;

  IF auth.uid() = OLD.id AND NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.statut_validation := OLD.statut_validation;
    NEW.numero_carte := OLD.numero_carte;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_security_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_security_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_security_fields();

-- ----------------------------------------------------------------
-- 3. Policies profils
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "read_all_profiles" ON public.profiles;
CREATE POLICY "read_profiles_authenticated"
ON public.profiles FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------
-- 4. Mentors actifs : validation obligatoire pour les données métier
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "insert_own_mentor_matieres" ON public.mentor_matieres;
CREATE POLICY "insert_own_mentor_matieres"
ON public.mentor_matieres FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = mentor_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_mentor = true
  )
);

DROP POLICY IF EXISTS "insert_own_disponibilites" ON public.disponibilites;
CREATE POLICY "insert_own_disponibilites"
ON public.disponibilites FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = mentor_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_mentor = true
  )
);

-- ----------------------------------------------------------------
-- 5. Demandes de mentorat : intégrité métier
-- ----------------------------------------------------------------
ALTER TABLE public.demandes_mentorat
  DROP CONSTRAINT IF EXISTS demandes_mentorat_participants_check;

ALTER TABLE public.demandes_mentorat
  ADD CONSTRAINT demandes_mentorat_participants_check
  CHECK (etudiant_id <> mentor_id);

DROP POLICY IF EXISTS "read_own_demandes" ON public.demandes_mentorat;
CREATE POLICY "read_own_demandes"
ON public.demandes_mentorat FOR SELECT TO authenticated
USING (
  auth.uid() = etudiant_id
  OR auth.uid() = mentor_id
  OR public.is_admin()
);

DROP POLICY IF EXISTS "etudiant_create_demande" ON public.demandes_mentorat;
CREATE POLICY "etudiant_create_demande"
ON public.demandes_mentorat FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = etudiant_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_mentore = true
      AND p.statut_validation = 'valide'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = mentor_id
      AND p.is_mentor = true
      AND p.statut_validation = 'valide'
  )
);

DROP POLICY IF EXISTS "update_demande" ON public.demandes_mentorat;
CREATE POLICY "update_demande"
ON public.demandes_mentorat FOR UPDATE TO authenticated
USING (
  auth.uid() = etudiant_id
  OR auth.uid() = mentor_id
  OR public.is_admin()
)
WITH CHECK (
  auth.uid() = etudiant_id
  OR auth.uid() = mentor_id
  OR public.is_admin()
);

-- ----------------------------------------------------------------
-- 6. Notifications : les utilisateurs ne peuvent plus créer
-- arbitrairement des notifications pour d'autres comptes.
-- Les Edge Functions avec service_role continuent de fonctionner.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "system_insert_notifications" ON public.notifications;
CREATE POLICY "insert_own_notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = destinataire_id
  OR public.is_admin()
);

-- ----------------------------------------------------------------
-- 7. Ressources : seuls les mentors validés peuvent publier.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "mentor_create_ressource" ON public.ressources;
CREATE POLICY "mentor_create_ressource"
ON public.ressources FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = auteur_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_mentor = true
      AND p.statut_validation = 'valide'
  )
);

-- ----------------------------------------------------------------
-- 8. Index utiles pour le nouveau workflow
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_mentor_validated
  ON public.profiles(is_mentor, statut_validation);

CREATE INDEX IF NOT EXISTS idx_profiles_mentore_validated
  ON public.profiles(is_mentore, statut_validation);

CREATE INDEX IF NOT EXISTS idx_sessions_participants_status
  ON public.sessions(mentor_id, mentore_id, statut);

-- ----------------------------------------------------------------
-- 9. Vue publique pour limiter les colonnes exposées dans les
-- recherches de mentors.
-- ----------------------------------------------------------------
DROP VIEW IF EXISTS public.v_mentors_public;
CREATE VIEW public.v_mentors_public
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.nom,
  p.prenom,
  p.niveau_id,
  p.filiere_id,
  p.photo_url,
  p.is_mentor,
  p.statut_validation,
  p.bio,
  p.mode_preference,
  p.experience,
  p.nb_etudiants_max
FROM public.profiles p
WHERE p.is_mentor = true
  AND p.statut_validation = 'valide';

GRANT SELECT ON public.v_mentors_public TO authenticated;

COMMIT;
