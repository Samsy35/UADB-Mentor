/*
# MentorUADB — Modules notifications, ressources, suivi académique et signalements

## Description
Complète le schéma pour couvrir les modules du cahier des charges encore absents :
notifications, ressources pédagogiques, comptes rendus de séance (suivi académique),
signalements, évaluation multi-critères et champs de profil mentor (expérience, mode).

## Nouvelles tables
1. `notifications` — Notifications internes (type, titre, contenu, lien, lu)
2. `ressources` — Ressources pédagogiques partagées par les mentors (PDF, lien, exercice…)
3. `comptes_rendus` — Compte rendu pédagogique d'une séance (mentor et mentoré)
4. `signalements` — Signalements d'utilisateurs ou de contenus, traités par l'administration

## Colonnes ajoutées
- `evaluations` : notes détaillées (pédagogie, ponctualité, clarté, disponibilité) et `masquee` (modération)
- `profiles` : `experience`, `mode_preference`
- `matieres` : `code`, `niveau_id`

## Sécurité
- RLS activée sur toutes les nouvelles tables.
- Notifications : lecture/mise à jour par le destinataire uniquement.
- Ressources : lecture par tout utilisateur authentifié, écriture par le mentor propriétaire.
- Comptes rendus : accessibles aux deux participants de la séance, écriture par leur auteur.
- Signalements : création par tout utilisateur authentifié, lecture par l'auteur ou un admin,
  mise à jour réservée aux admins.
- Les triggers de notification sont SECURITY DEFINER pour pouvoir écrire chez le destinataire.
*/

-- ============================================================
-- COLONNES COMPLÉMENTAIRES
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mode_preference text NOT NULL DEFAULT 'les_deux';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_mode_preference_check') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_mode_preference_check
      CHECK (mode_preference IN ('en_ligne','presentiel','les_deux'));
  END IF;
END $$;

ALTER TABLE matieres ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE matieres ADD COLUMN IF NOT EXISTS niveau_id uuid REFERENCES niveaux(id) ON DELETE SET NULL;

ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS note_pedagogie int CHECK (note_pedagogie BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS note_ponctualite int CHECK (note_ponctualite BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS note_clarte int CHECK (note_clarte BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS note_disponibilite int CHECK (note_disponibilite BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS masquee boolean NOT NULL DEFAULT false;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'demande_recue','demande_acceptee','demande_refusee','session_annulee',
    'session_terminee','nouveau_message','nouvelle_evaluation','compte_valide','nouvelle_ressource'
  )),
  titre text NOT NULL,
  contenu text,
  lien text,
  lu boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, lu, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_notifications" ON notifications;
CREATE POLICY "read_own_notifications" ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- ============================================================
-- RESSOURCES PÉDAGOGIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS ressources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matiere_id uuid REFERENCES matieres(id) ON DELETE SET NULL,
  niveau_id uuid REFERENCES niveaux(id) ON DELETE SET NULL,
  titre text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'lien' CHECK (type IN ('pdf','exercice','fiche','lien','cours','annale','correction')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ressources_matiere ON ressources(matiere_id);
CREATE INDEX IF NOT EXISTS idx_ressources_mentor ON ressources(mentor_id);

ALTER TABLE ressources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_ressources" ON ressources;
CREATE POLICY "read_ressources" ON ressources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_ressources" ON ressources;
CREATE POLICY "insert_own_ressources" ON ressources FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "update_own_ressources" ON ressources;
CREATE POLICY "update_own_ressources" ON ressources FOR UPDATE TO authenticated
  USING (auth.uid() = mentor_id) WITH CHECK (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "delete_own_ressources" ON ressources;
CREATE POLICY "delete_own_ressources" ON ressources FOR DELETE TO authenticated
  USING (auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- COMPTES RENDUS DE SÉANCE (SUIVI ACADÉMIQUE)
-- ============================================================

CREATE TABLE IF NOT EXISTS comptes_rendus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  auteur_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sujet_traite text NOT NULL,
  notions_abordees text,
  difficultes text,
  exercices text,
  niveau_comprehension int NOT NULL DEFAULT 3 CHECK (niveau_comprehension BETWEEN 1 AND 5),
  recommandations text,
  objectif_prochaine text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, auteur_id)
);

CREATE INDEX IF NOT EXISTS idx_comptes_rendus_session ON comptes_rendus(session_id);

ALTER TABLE comptes_rendus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_comptes_rendus" ON comptes_rendus;
CREATE POLICY "read_comptes_rendus" ON comptes_rendus FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = comptes_rendus.session_id
    AND (s.mentor_id = auth.uid() OR s.mentore_id = auth.uid())));

DROP POLICY IF EXISTS "insert_own_comptes_rendus" ON comptes_rendus;
CREATE POLICY "insert_own_comptes_rendus" ON comptes_rendus FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auteur_id
    AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = comptes_rendus.session_id
      AND (s.mentor_id = auth.uid() OR s.mentore_id = auth.uid())));

DROP POLICY IF EXISTS "update_own_comptes_rendus" ON comptes_rendus;
CREATE POLICY "update_own_comptes_rendus" ON comptes_rendus FOR UPDATE TO authenticated
  USING (auth.uid() = auteur_id) WITH CHECK (auth.uid() = auteur_id);

-- ============================================================
-- SIGNALEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signaleur_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signale_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  motif text NOT NULL CHECK (motif IN ('absence','comportement','contenu_inapproprie','faux_profil','autre')),
  description text,
  statut text NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert','en_cours','resolu','rejete')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signalements_statut ON signalements(statut, created_at DESC);

ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_signalements" ON signalements;
CREATE POLICY "read_signalements" ON signalements FOR SELECT TO authenticated
  USING (auth.uid() = signaleur_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "insert_signalements" ON signalements;
CREATE POLICY "insert_signalements" ON signalements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = signaleur_id AND auth.uid() <> signale_id);

DROP POLICY IF EXISTS "admin_update_signalements" ON signalements;
CREATE POLICY "admin_update_signalements" ON signalements FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- MODÉRATION DES ÉVALUATIONS PAR L'ADMINISTRATION
-- ============================================================

DROP POLICY IF EXISTS "admin_update_evaluations" ON evaluations;
CREATE POLICY "admin_update_evaluations" ON evaluations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "admin_read_evaluations" ON evaluations;
CREATE POLICY "admin_read_evaluations" ON evaluations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- RG07 : UN MENTOR SUSPENDU NE REÇOIT PLUS DE DEMANDES
-- ============================================================

CREATE OR REPLACE FUNCTION check_mentor_actif()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  statut text;
BEGIN
  SELECT statut_validation INTO statut FROM profiles WHERE id = NEW.mentor_id;
  IF statut = 'suspendu' THEN
    RAISE EXCEPTION 'Ce mentor est suspendu et ne peut plus recevoir de demandes.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_mentor_actif ON sessions;
CREATE TRIGGER trg_check_mentor_actif BEFORE INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION check_mentor_actif();

-- ============================================================
-- GÉNÉRATION AUTOMATIQUE DES NOTIFICATIONS
-- ============================================================

CREATE OR REPLACE FUNCTION notify_session_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  matiere_nom text;
BEGIN
  SELECT nom INTO matiere_nom FROM matieres WHERE id = NEW.matiere_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, titre, contenu, lien)
    VALUES (NEW.mentor_id, 'demande_recue', 'Nouvelle demande de session',
      'Vous avez reçu une demande de session en ' || COALESCE(matiere_nom, 'une matière') || '.', '/app/sessions');
    RETURN NEW;
  END IF;

  IF NEW.statut IS DISTINCT FROM OLD.statut THEN
    IF NEW.statut = 'acceptee' THEN
      INSERT INTO notifications (user_id, type, titre, contenu, lien)
      VALUES (NEW.mentore_id, 'demande_acceptee', 'Demande acceptée',
        'Votre demande de session en ' || COALESCE(matiere_nom, 'une matière') || ' a été acceptée.', '/app/sessions');
    ELSIF NEW.statut = 'refusee' THEN
      INSERT INTO notifications (user_id, type, titre, contenu, lien)
      VALUES (NEW.mentore_id, 'demande_refusee', 'Demande refusée',
        'Votre demande de session en ' || COALESCE(matiere_nom, 'une matière') || ' a été refusée.', '/app/sessions');
    ELSIF NEW.statut = 'annulee' THEN
      INSERT INTO notifications (user_id, type, titre, contenu, lien)
      VALUES (NEW.mentor_id, 'session_annulee', 'Session annulée',
        'Une session en ' || COALESCE(matiere_nom, 'une matière') || ' a été annulée.', '/app/sessions'),
        (NEW.mentore_id, 'session_annulee', 'Session annulée',
        'Une session en ' || COALESCE(matiere_nom, 'une matière') || ' a été annulée.', '/app/sessions');
    ELSIF NEW.statut = 'terminee' THEN
      INSERT INTO notifications (user_id, type, titre, contenu, lien)
      VALUES (NEW.mentore_id, 'session_terminee', 'Session terminée',
        'Votre session en ' || COALESCE(matiere_nom, 'une matière') || ' est terminée. Vous pouvez l''évaluer.', '/app/sessions');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_session_insert ON sessions;
CREATE TRIGGER trg_notify_session_insert AFTER INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION notify_session_event();

DROP TRIGGER IF EXISTS trg_notify_session_update ON sessions;
CREATE TRIGGER trg_notify_session_update AFTER UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION notify_session_event();

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  expediteur_nom text;
BEGIN
  SELECT prenom || ' ' || nom INTO expediteur_nom FROM profiles WHERE id = NEW.expediteur_id;
  INSERT INTO notifications (user_id, type, titre, contenu, lien)
  VALUES (NEW.destinataire_id, 'nouveau_message', 'Nouveau message',
    COALESCE(expediteur_nom, 'Un utilisateur') || ' vous a envoyé un message.', '/app/messages');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_message ON messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

CREATE OR REPLACE FUNCTION notify_new_evaluation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (user_id, type, titre, contenu, lien)
  VALUES (NEW.evalue_id, 'nouvelle_evaluation', 'Nouvelle évaluation',
    'Vous avez reçu une évaluation de ' || NEW.note || '/5.', '/app/sessions');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_evaluation ON evaluations;
CREATE TRIGGER trg_notify_evaluation AFTER INSERT ON evaluations
  FOR EACH ROW EXECUTE FUNCTION notify_new_evaluation();

CREATE OR REPLACE FUNCTION notify_profile_validated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.statut_validation = 'valide' AND OLD.statut_validation IS DISTINCT FROM 'valide' THEN
    INSERT INTO notifications (user_id, type, titre, contenu, lien)
    VALUES (NEW.id, 'compte_valide', 'Compte validé',
      'Votre compte a été validé par l''administration. Vous pouvez utiliser toutes les fonctionnalités.', '/app');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_profile_validated ON profiles;
CREATE TRIGGER trg_notify_profile_validated AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_profile_validated();
