/* MentorUADB — console admin + garde-fous messagerie */

-- Les administrateurs ne participent jamais aux rôles de mentorat.
UPDATE public.profiles
SET is_mentor = false, is_mentore = false, statut_validation = 'valide'
WHERE is_admin = true;

-- Autoriser l'administration à supprimer un profil. Le compte Auth n'est pas supprimé
-- par le client Supabase : cette opération supprime les données applicatives du profil.
DROP POLICY IF EXISTS "admin_delete_profiles" ON public.profiles;
CREATE POLICY "admin_delete_profiles" ON public.profiles
FOR DELETE TO authenticated
USING (public.is_admin() AND id <> auth.uid());

CREATE OR REPLACE FUNCTION public.admin_delete_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès administrateur requis';
  END IF;
  IF p_profile_id = auth.uid() THEN
    RAISE EXCEPTION 'Un administrateur ne peut pas supprimer son propre profil';
  END IF;
  DELETE FROM public.profiles WHERE id = p_profile_id;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_profile(uuid) TO authenticated;

-- Les utilisateurs ne peuvent ni démarrer ni recevoir une conversation avec un admin.
DROP POLICY IF EXISTS "send_messages" ON public.messages;
CREATE POLICY "send_messages" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = expediteur_id
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = expediteur_id AND p.is_admin)
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = destinataire_id AND p.is_admin)
  AND (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.statut IN ('acceptee','confirmee','en_cours')
        AND ((s.mentor_id = auth.uid() AND s.mentore_id = destinataire_id)
          OR (s.mentore_id = auth.uid() AND s.mentor_id = destinataire_id))
    )
    OR EXISTS (
      SELECT 1 FROM public.demandes_mentorat d
      WHERE d.statut IN ('en_attente','acceptee')
        AND ((d.etudiant_id = auth.uid() AND d.mentor_id = destinataire_id)
          OR (d.mentor_id = auth.uid() AND d.etudiant_id = destinataire_id))
    )
  )
);

DROP POLICY IF EXISTS "read_messages" ON public.messages;
CREATE POLICY "read_messages" ON public.messages FOR SELECT TO authenticated
USING (
  (auth.uid() = expediteur_id OR auth.uid() = destinataire_id)
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = expediteur_id AND p.is_admin)
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = destinataire_id AND p.is_admin)
);

-- L'admin conserve une lecture de modération sans apparaître dans les contacts utilisateurs.
DROP POLICY IF EXISTS "admin_read_messages" ON public.messages;
CREATE POLICY "admin_read_messages" ON public.messages FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_messages" ON public.messages;
CREATE POLICY "admin_delete_messages" ON public.messages FOR DELETE TO authenticated
USING (public.is_admin() OR auth.uid() = expediteur_id);

-- Écriture du catalogue réservée aux admins, avec lecture publique.
ALTER TABLE public.filieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niveaux ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_filieres" ON public.filieres;
CREATE POLICY "public_read_filieres" ON public.filieres FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_read_matieres" ON public.matieres;
CREATE POLICY "public_read_matieres" ON public.matieres FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_read_niveaux" ON public.niveaux;
CREATE POLICY "public_read_niveaux" ON public.niveaux FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_filieres" ON public.filieres;
CREATE POLICY "admin_write_filieres" ON public.filieres FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_write_matieres" ON public.matieres;
CREATE POLICY "admin_write_matieres" ON public.matieres FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_write_niveaux" ON public.niveaux;
CREATE POLICY "admin_write_niveaux" ON public.niveaux FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
