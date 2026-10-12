/* MentorUADB — hardening final
   - empêche l'auto-promotion en administrateur;
   - sécurise le catalogue UFR et les tables d'association;
   - empêche un mentor d'associer une matière d'une autre filière;
   - normalise les rôles des administrateurs existants.
*/

-- Tous les administrateurs existants doivent rester exclusivement administrateurs.
UPDATE public.profiles
SET is_mentor = false,
    is_mentore = false,
    statut_validation = 'valide'
WHERE is_admin = true;

-- Sécurité contre l'élévation de privilèges via UPDATE de profiles.
CREATE OR REPLACE FUNCTION public.guard_profile_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  n_ordre int;
  caller_is_admin boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    SELECT COALESCE(p.is_admin, false)
      INTO caller_is_admin
    FROM public.profiles p
    WHERE p.id = auth.uid();

    -- Un utilisateur normal ne peut jamais se promouvoir administrateur.
    -- Une opération serveur (auth.uid() IS NULL) ou un administrateur peut modifier ce rôle.
    IF auth.uid() IS NOT NULL AND NOT caller_is_admin THEN
      RAISE EXCEPTION 'Seul un administrateur peut modifier le rôle administrateur';
    END IF;
  END IF;

  IF NEW.is_admin THEN
    NEW.is_mentor := false;
    NEW.is_mentore := false;
    NEW.statut_validation := 'valide';
    RETURN NEW;
  END IF;

  IF NEW.is_mentor THEN
    SELECT ordre INTO n_ordre FROM public.niveaux WHERE id = NEW.niveau_id;
    IF COALESCE(n_ordre, 0) < 2 THEN
      NEW.statut_validation := 'suspendu';
    ELSIF TG_OP = 'INSERT' THEN
      NEW.statut_validation := 'en_attente';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_roles ON public.profiles;
CREATE TRIGGER trg_guard_profile_roles
BEFORE INSERT OR UPDATE OF is_admin, is_mentor, is_mentore, niveau_id, statut_validation
ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_roles();

-- Catalogue UFR : lecture publique, écriture réservée aux administrateurs.
ALTER TABLE public.ufrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiere_niveaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matiere_niveaux ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_ufrs" ON public.ufrs;
CREATE POLICY "public_read_ufrs" ON public.ufrs
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_ufrs" ON public.ufrs;
CREATE POLICY "admin_write_ufrs" ON public.ufrs
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "public_read_filiere_niveaux" ON public.filiere_niveaux;
CREATE POLICY "public_read_filiere_niveaux" ON public.filiere_niveaux
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_filiere_niveaux" ON public.filiere_niveaux;
CREATE POLICY "admin_write_filiere_niveaux" ON public.filiere_niveaux
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "public_read_matiere_niveaux" ON public.matiere_niveaux;
CREATE POLICY "public_read_matiere_niveaux" ON public.matiere_niveaux
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_matiere_niveaux" ON public.matiere_niveaux;
CREATE POLICY "admin_write_matiere_niveaux" ON public.matiere_niveaux
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Un mentor ne peut proposer que des matières rattachées à sa propre filière.
CREATE OR REPLACE FUNCTION public.mentor_matiere_same_filiere(p_mentor_id uuid, p_matiere_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.matieres m ON m.id = p_matiere_id
    WHERE p.id = p_mentor_id
      AND p.filiere_id IS NOT NULL
      AND m.filiere_id = p.filiere_id
      AND m.actif = true
  );
$$;

DROP POLICY IF EXISTS "insert_own_mentor_matieres" ON public.mentor_matieres;
CREATE POLICY "insert_own_mentor_matieres" ON public.mentor_matieres
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = mentor_id
  AND public.mentor_eligible(mentor_id)
  AND public.mentor_matiere_same_filiere(mentor_id, matiere_id)
);

DROP POLICY IF EXISTS "update_own_mentor_matieres" ON public.mentor_matieres;
CREATE POLICY "update_own_mentor_matieres" ON public.mentor_matieres
FOR UPDATE TO authenticated
USING (auth.uid() = mentor_id AND public.mentor_eligible(mentor_id))
WITH CHECK (
  auth.uid() = mentor_id
  AND public.mentor_eligible(mentor_id)
  AND public.mentor_matiere_same_filiere(mentor_id, matiere_id)
);

-- La vue de recherche ne retourne que des mentors validés et éligibles.
CREATE OR REPLACE VIEW public.v_mentor_search AS
SELECT
  p.id,
  p.nom,
  p.prenom,
  p.niveau_id,
  p.filiere_id,
  p.photo_url,
  p.bio,
  f.nom AS filiere_nom,
  f.ufr_id,
  u.code AS ufr_code,
  u.nom AS ufr_nom,
  n.code AS niveau_code,
  n.nom AS niveau_nom,
  n.ordre AS niveau_ordre
FROM public.profiles p
JOIN public.filieres f ON f.id = p.filiere_id
JOIN public.ufrs u ON u.id = f.ufr_id
JOIN public.niveaux n ON n.id = p.niveau_id
WHERE p.is_mentor = true
  AND p.is_admin = false
  AND p.statut_validation = 'valide'
  AND n.ordre >= 2;

GRANT SELECT ON public.v_mentor_search TO anon, authenticated;
