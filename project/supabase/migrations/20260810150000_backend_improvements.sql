/*
# MentorUADB — Améliorations backend (v2)

## Résumé
Aligne le backend sur le cahier des charges complet.
Aucune table ou colonne existante n'est supprimée — migration additive et idempotente.

## Nouvelles tables
1. `demandes_mentorat`  — demandes formelles étudiant → mentor (§13 CDC)
2. `suivi_seances`      — rapport post-séance du mentor (§17 CDC)
3. `ressources`         — ressources pédagogiques partagées (§18 CDC)
4. `notifications`      — notifications internes (§20 CDC)
5. `signalements`       — signalements de contenu / utilisateurs (§35 CDC)

## Colonnes ajoutées
- `matieres.code`                       — code court (ex: ALGO-L2)
- `matieres.niveau_id`                  — niveau cible de la matière
- `profiles.mode_preference`            — préférence présentiel/distanciel
- `profiles.nb_etudiants_max`           — limite étudiants simultanés (mentor)
- `profiles.experience`                 — description expérience (mentor)
- `evaluations.qualite_pedagogique`     — critère 1/5 (§19 CDC)
- `evaluations.ponctualite`             — critère 2/5
- `evaluations.clarte_explications`     — critère 3/5
- `evaluations.disponibilite`           — critère 4/5
- `evaluations.satisfaction_generale`   — critère 5/5
- `evaluations.note_globale`            — moyenne calculée auto
- `sessions.statut` étendu              — ajout 'confirmee' et 'en_cours'
- `sessions.notes_mentor`               — notes libres du mentor
- `sessions.theme`                      — thème de la séance

## Vues SQL
- `v_mentor_stats`     — stats agrégées par mentor (pour matching + tableau de bord)
- `v_admin_dashboard`  — KPIs globaux pour l'admin
- `v_session_details`  — vue enrichie sessions avec profils et matière

## Triggers
- `trg_notification_new_demande`        — notifie le mentor d'une nouvelle demande
- `trg_notification_session_status`     — notifie sur changement de statut session
- `trg_notification_new_message`        — notifie le destinataire d'un message
- `trg_evaluations_note_globale`        — calcule note_globale auto à l'insert/update
- `trg_demandes_updated_at`             — met à jour updated_at

## Sécurité
- RLS activée sur toutes les nouvelles tables
- Messages restreints aux utilisateurs ayant une relation de mentorat active
- Admins peuvent lire/gérer toutes les données sensibles
- Signalements : lecture admin uniquement
*/

-- ============================================================
-- 1. COLONNES MANQUANTES SUR LES TABLES EXISTANTES
-- ============================================================

-- matieres : ajouter code + niveau_id
ALTER TABLE matieres ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE matieres ADD COLUMN IF NOT EXISTS niveau_id uuid REFERENCES niveaux(id) ON DELETE SET NULL;

-- Remplir les codes manquants pour les matières existantes (ON CONFLICT safe)
UPDATE matieres SET code = UPPER(LEFT(REGEXP_REPLACE(nom, '[^a-zA-Z]', '', 'g'), 6))
WHERE code IS NULL;

-- profiles : colonnes mentor enrichies
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mode_preference text DEFAULT 'les_deux'
  CHECK (mode_preference IN ('en_ligne','presentiel','les_deux'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nb_etudiants_max int DEFAULT 5 CHECK (nb_etudiants_max BETWEEN 1 AND 20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience text;

-- sessions : colonnes manquantes
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS notes_mentor text;

-- Étendre le CHECK de statut sessions pour inclure 'confirmee' et 'en_cours'
-- On recrée la contrainte proprement
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_statut_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_statut_check
  CHECK (statut IN ('demandee','acceptee','confirmee','en_cours','refusee','terminee','annulee'));

-- evaluations : multi-critères (§19 CDC)
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS qualite_pedagogique int CHECK (qualite_pedagogique BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS ponctualite int CHECK (ponctualite BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS clarte_explications int CHECK (clarte_explications BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS disponibilite_mentor int CHECK (disponibilite_mentor BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS satisfaction_generale int CHECK (satisfaction_generale BETWEEN 1 AND 5);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS note_globale numeric(3,2);
-- Migrer la note existante vers note_globale si note_globale est null
UPDATE evaluations SET note_globale = note::numeric WHERE note_globale IS NULL;

-- ============================================================
-- 2. NOUVELLES TABLES
-- ============================================================

-- 2.1 DEMANDES DE MENTORAT (§13 CDC)
CREATE TABLE IF NOT EXISTS demandes_mentorat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matiere_id  uuid NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  description_difficulte text NOT NULL,
  objectif text,
  niveau_etudiant_id uuid REFERENCES niveaux(id),
  frequence_souhaitee text,             -- ex: '2 fois par semaine'
  duree_souhaitee text,                 -- ex: '3 semaines'
  mode_souhaite text DEFAULT 'les_deux'
    CHECK (mode_souhaite IN ('en_ligne','presentiel','les_deux')),
  statut text NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente','acceptee','refusee','modif_demandee','annulee')),
  message_refus text,                   -- raison si refusée ou modif demandée
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.2 SUIVI DES SÉANCES (§17 CDC)
CREATE TABLE IF NOT EXISTS suivi_seances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  mentor_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sujet_traite text,
  notions_abordees text,
  difficultes_observees text,
  exercices_realises text,
  niveau_comprehension_mentor text     -- appréciation du mentor
    CHECK (niveau_comprehension_mentor IN ('insuffisant','en_progres','acquis','excellent')),
  niveau_comprehension_etudiant text   -- auto-évaluation étudiant
    CHECK (niveau_comprehension_etudiant IN ('incompris','partiellement','bien_compris','tres_bien_compris')),
  recommandations text,
  objectif_prochaine_seance text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id)                   -- un seul suivi par session
);

-- 2.3 RESSOURCES PÉDAGOGIQUES (§18 CDC)
CREATE TABLE IF NOT EXISTS ressources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matiere_id   uuid REFERENCES matieres(id) ON DELETE SET NULL,
  niveau_id    uuid REFERENCES niveaux(id) ON DELETE SET NULL,
  titre        text NOT NULL,
  description  text,
  type_ressource text NOT NULL DEFAULT 'lien'
    CHECK (type_ressource IN ('pdf','exercice','fiche','lien','cours','annale','correction')),
  url          text,                   -- lien ou chemin fichier Supabase Storage
  publique     boolean NOT NULL DEFAULT false, -- visible à tous ou seulement aux mentores du mentor
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Lien ressource ↔ session (optionnel)
CREATE TABLE IF NOT EXISTS session_ressources (
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ressource_id uuid NOT NULL REFERENCES ressources(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, ressource_id)
);

-- 2.4 NOTIFICATIONS INTERNES (§20 CDC)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expediteur_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- null = système
  type text NOT NULL
    CHECK (type IN (
      'nouvelle_demande','demande_acceptee','demande_refusee','demande_modif',
      'nouveau_message','session_programmee','rappel_session',
      'session_annulee','session_terminee','nouvelle_evaluation',
      'compte_valide','compte_suspendu','info'
    )),
  titre        text NOT NULL,
  contenu      text NOT NULL,
  lien         text,                   -- URL relative vers l'entité concernée
  lu           boolean NOT NULL DEFAULT false,
  entite_type  text,                   -- 'session' | 'demande' | 'message' | etc.
  entite_id    uuid,                   -- ID de l'entité concernée
  created_at   timestamptz DEFAULT now()
);

-- 2.5 SIGNALEMENTS (§35 CDC)
CREATE TABLE IF NOT EXISTS signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declarant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cible_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,      -- utilisateur signalé
  entite_type  text,                   -- 'message' | 'ressource' | 'evaluation' | 'profil'
  entite_id    uuid,
  motif        text NOT NULL
    CHECK (motif IN ('contenu_inapproprie','comportement','spam','faux_compte','autre')),
  description  text,
  statut       text NOT NULL DEFAULT 'ouvert'
    CHECK (statut IN ('ouvert','en_cours','resolu','rejete')),
  traite_par   uuid REFERENCES profiles(id) ON DELETE SET NULL,      -- admin
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ============================================================
-- 3. INDEX SUPPLÉMENTAIRES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_demandes_etudiant   ON demandes_mentorat(etudiant_id);
CREATE INDEX IF NOT EXISTS idx_demandes_mentor      ON demandes_mentorat(mentor_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut      ON demandes_mentorat(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_matiere     ON demandes_mentorat(matiere_id);
CREATE INDEX IF NOT EXISTS idx_suivi_session        ON suivi_seances(session_id);
CREATE INDEX IF NOT EXISTS idx_suivi_mentor         ON suivi_seances(mentor_id);
CREATE INDEX IF NOT EXISTS idx_ressources_auteur    ON ressources(auteur_id);
CREATE INDEX IF NOT EXISTS idx_ressources_matiere   ON ressources(matiere_id);
CREATE INDEX IF NOT EXISTS idx_notifs_destinataire  ON notifications(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_notifs_lu            ON notifications(lu);
CREATE INDEX IF NOT EXISTS idx_signalements_statut  ON signalements(statut);
CREATE INDEX IF NOT EXISTS idx_signalements_cible   ON signalements(cible_id);

-- ============================================================
-- 4. RLS — NOUVELLES TABLES
-- ============================================================

-- ---- DEMANDES DE MENTORAT ----
ALTER TABLE demandes_mentorat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_demandes" ON demandes_mentorat;
CREATE POLICY "read_own_demandes" ON demandes_mentorat FOR SELECT TO authenticated
  USING (
    auth.uid() = etudiant_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "etudiant_create_demande" ON demandes_mentorat;
CREATE POLICY "etudiant_create_demande" ON demandes_mentorat FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = etudiant_id
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_mentore)
  );

DROP POLICY IF EXISTS "update_demande" ON demandes_mentorat;
CREATE POLICY "update_demande" ON demandes_mentorat FOR UPDATE TO authenticated
  USING (
    auth.uid() = etudiant_id         -- étudiant peut annuler sa demande
    OR auth.uid() = mentor_id         -- mentor peut accepter/refuser
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  )
  WITH CHECK (
    auth.uid() = etudiant_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "etudiant_delete_demande" ON demandes_mentorat;
CREATE POLICY "etudiant_delete_demande" ON demandes_mentorat FOR DELETE TO authenticated
  USING (auth.uid() = etudiant_id);

-- ---- SUIVI SÉANCES ----
ALTER TABLE suivi_seances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_suivi" ON suivi_seances;
CREATE POLICY "read_suivi" ON suivi_seances FOR SELECT TO authenticated
  USING (
    auth.uid() = mentor_id
    OR EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = suivi_seances.session_id AND s.mentore_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "mentor_create_suivi" ON suivi_seances;
CREATE POLICY "mentor_create_suivi" ON suivi_seances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "update_suivi" ON suivi_seances;
CREATE POLICY "update_suivi" ON suivi_seances FOR UPDATE TO authenticated
  USING (
    auth.uid() = mentor_id
    OR EXISTS (                        -- étudiant peut renseigner son niveau compréhension
      SELECT 1 FROM sessions s
      WHERE s.id = suivi_seances.session_id AND s.mentore_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = mentor_id
    OR EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = suivi_seances.session_id AND s.mentore_id = auth.uid()
    )
  );

-- ---- RESSOURCES ----
ALTER TABLE ressources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_ressources_publiques" ON ressources;
CREATE POLICY "read_ressources_publiques" ON ressources FOR SELECT TO authenticated
  USING (
    publique = true
    OR auth.uid() = auteur_id
    OR EXISTS (                        -- accès si partage dans une session commune
      SELECT 1 FROM session_ressources sr
      JOIN sessions s ON s.id = sr.session_id
      WHERE sr.ressource_id = ressources.id
        AND (s.mentor_id = auth.uid() OR s.mentore_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "mentor_create_ressource" ON ressources;
CREATE POLICY "mentor_create_ressource" ON ressources FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auteur_id);

DROP POLICY IF EXISTS "auteur_update_ressource" ON ressources;
CREATE POLICY "auteur_update_ressource" ON ressources FOR UPDATE TO authenticated
  USING (auth.uid() = auteur_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (auth.uid() = auteur_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "auteur_delete_ressource" ON ressources;
CREATE POLICY "auteur_delete_ressource" ON ressources FOR DELETE TO authenticated
  USING (auth.uid() = auteur_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- session_ressources
ALTER TABLE session_ressources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_session_ressources" ON session_ressources;
CREATE POLICY "read_session_ressources" ON session_ressources FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_ressources.session_id
        AND (s.mentor_id = auth.uid() OR s.mentore_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "mentor_add_session_ressource" ON session_ressources;
CREATE POLICY "mentor_add_session_ressource" ON session_ressources FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_ressources.session_id AND s.mentor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mentor_remove_session_ressource" ON session_ressources;
CREATE POLICY "mentor_remove_session_ressource" ON session_ressources FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_ressources.session_id AND s.mentor_id = auth.uid()
    )
  );

-- ---- NOTIFICATIONS ----
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_notifications" ON notifications;
CREATE POLICY "read_own_notifications" ON notifications FOR SELECT TO authenticated
  USING (
    auth.uid() = destinataire_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "system_insert_notifications" ON notifications;
CREATE POLICY "system_insert_notifications" ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);  -- les Edge Functions (service role) insèrent librement

DROP POLICY IF EXISTS "mark_notif_read" ON notifications;
CREATE POLICY "mark_notif_read" ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = destinataire_id)
  WITH CHECK (auth.uid() = destinataire_id);

DROP POLICY IF EXISTS "delete_own_notif" ON notifications;
CREATE POLICY "delete_own_notif" ON notifications FOR DELETE TO authenticated
  USING (auth.uid() = destinataire_id);

-- ---- SIGNALEMENTS ----
ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "declarant_read_own" ON signalements;
CREATE POLICY "declarant_read_own" ON signalements FOR SELECT TO authenticated
  USING (
    auth.uid() = declarant_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "create_signalement" ON signalements;
CREATE POLICY "create_signalement" ON signalements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = declarant_id);

DROP POLICY IF EXISTS "admin_update_signalement" ON signalements;
CREATE POLICY "admin_update_signalement" ON signalements FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "admin_delete_signalement" ON signalements;
CREATE POLICY "admin_delete_signalement" ON signalements FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ============================================================
-- 5. AMÉLIORATION RLS MESSAGES — restreindre aux relations actives
-- ============================================================

-- Remplacer la policy d'envoi de messages : seuls les utilisateurs ayant
-- une session active (acceptee / confirmee / en_cours) peuvent s'écrire.
-- Les admins peuvent lire tous les messages pour modération.

DROP POLICY IF EXISTS "send_messages" ON messages;
CREATE POLICY "send_messages" ON messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = expediteur_id
    AND (
      -- Au moins une session ou demande active entre les deux utilisateurs
      EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.statut IN ('acceptee','confirmee','en_cours')
          AND (
            (s.mentor_id = auth.uid() AND s.mentore_id = destinataire_id)
            OR (s.mentore_id = auth.uid() AND s.mentor_id = destinataire_id)
          )
      )
      OR EXISTS (
        SELECT 1 FROM demandes_mentorat d
        WHERE d.statut IN ('en_attente','acceptee')
          AND (
            (d.etudiant_id = auth.uid() AND d.mentor_id = destinataire_id)
            OR (d.mentor_id = auth.uid() AND d.etudiant_id = destinataire_id)
          )
      )
      -- Les admins peuvent toujours écrire
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
    )
  );

-- Admin peut lire tous les messages
DROP POLICY IF EXISTS "admin_read_messages" ON messages;
CREATE POLICY "admin_read_messages" ON messages FOR SELECT TO authenticated
  USING (
    auth.uid() = expediteur_id
    OR auth.uid() = destinataire_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

-- Admin peut supprimer des messages (modération)
DROP POLICY IF EXISTS "admin_delete_messages" ON messages;
CREATE POLICY "admin_delete_messages" ON messages FOR DELETE TO authenticated
  USING (
    auth.uid() = expediteur_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- 6.1 Trigger updated_at pour les nouvelles tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_demandes_updated ON demandes_mentorat;
CREATE TRIGGER trg_demandes_updated BEFORE UPDATE ON demandes_mentorat
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_suivi_updated ON suivi_seances;
CREATE TRIGGER trg_suivi_updated BEFORE UPDATE ON suivi_seances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_ressources_updated ON ressources;
CREATE TRIGGER trg_ressources_updated BEFORE UPDATE ON ressources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_signalements_updated ON signalements;
CREATE TRIGGER trg_signalements_updated BEFORE UPDATE ON signalements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6.2 Calcul automatique note_globale évaluation (§19 CDC)
CREATE OR REPLACE FUNCTION calc_note_globale_evaluation()
RETURNS trigger AS $$
DECLARE
  total numeric := 0;
  count int := 0;
BEGIN
  IF NEW.qualite_pedagogique IS NOT NULL   THEN total := total + NEW.qualite_pedagogique; count := count + 1; END IF;
  IF NEW.ponctualite IS NOT NULL           THEN total := total + NEW.ponctualite; count := count + 1; END IF;
  IF NEW.clarte_explications IS NOT NULL   THEN total := total + NEW.clarte_explications; count := count + 1; END IF;
  IF NEW.disponibilite_mentor IS NOT NULL  THEN total := total + NEW.disponibilite_mentor; count := count + 1; END IF;
  IF NEW.satisfaction_generale IS NOT NULL THEN total := total + NEW.satisfaction_generale; count := count + 1; END IF;

  IF count > 0 THEN
    NEW.note_globale := ROUND(total / count, 2);
  ELSIF NEW.note IS NOT NULL THEN
    -- Fallback : utiliser la note unique si les critères ne sont pas remplis
    NEW.note_globale := NEW.note::numeric;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_evaluations_note_globale ON evaluations;
CREATE TRIGGER trg_evaluations_note_globale
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION calc_note_globale_evaluation();

-- 6.3 Notification automatique — nouvelle demande → mentor (§20 CDC)
CREATE OR REPLACE FUNCTION notify_mentor_new_demande()
RETURNS trigger AS $$
DECLARE
  etudiant_nom text;
  matiere_nom  text;
BEGIN
  SELECT CONCAT(p.prenom, ' ', p.nom) INTO etudiant_nom FROM profiles p WHERE p.id = NEW.etudiant_id;
  SELECT m.nom INTO matiere_nom FROM matieres m WHERE m.id = NEW.matiere_id;

  INSERT INTO notifications (destinataire_id, type, titre, contenu, lien, entite_type, entite_id)
  VALUES (
    NEW.mentor_id,
    'nouvelle_demande',
    'Nouvelle demande de mentorat',
    CONCAT(COALESCE(etudiant_nom, 'Un étudiant'), ' vous a envoyé une demande en ', COALESCE(matiere_nom, 'une matière')),
    CONCAT('/demandes/', NEW.id),
    'demande',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_new_demande ON demandes_mentorat;
CREATE TRIGGER trg_notification_new_demande
  AFTER INSERT ON demandes_mentorat
  FOR EACH ROW EXECUTE FUNCTION notify_mentor_new_demande();

-- 6.4 Notification automatique — changement statut demande → étudiant
CREATE OR REPLACE FUNCTION notify_etudiant_demande_status()
RETURNS trigger AS $$
DECLARE
  mentor_nom text;
  type_notif text;
  titre_notif text;
  contenu_notif text;
BEGIN
  IF OLD.statut = NEW.statut THEN RETURN NEW; END IF;

  SELECT CONCAT(p.prenom, ' ', p.nom) INTO mentor_nom FROM profiles p WHERE p.id = NEW.mentor_id;

  IF NEW.statut = 'acceptee' THEN
    type_notif := 'demande_acceptee';
    titre_notif := 'Demande acceptée !';
    contenu_notif := CONCAT(COALESCE(mentor_nom, 'Le mentor'), ' a accepté votre demande de mentorat.');
  ELSIF NEW.statut = 'refusee' THEN
    type_notif := 'demande_refusee';
    titre_notif := 'Demande refusée';
    contenu_notif := CONCAT(COALESCE(mentor_nom, 'Le mentor'), ' n''a pas pu accepter votre demande.');
  ELSIF NEW.statut = 'modif_demandee' THEN
    type_notif := 'demande_modif';
    titre_notif := 'Modification demandée';
    contenu_notif := CONCAT(COALESCE(mentor_nom, 'Le mentor'), ' demande des modifications à votre demande.');
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (destinataire_id, type, titre, contenu, lien, entite_type, entite_id)
  VALUES (
    NEW.etudiant_id,
    type_notif,
    titre_notif,
    contenu_notif,
    CONCAT('/demandes/', NEW.id),
    'demande',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_demande_status ON demandes_mentorat;
CREATE TRIGGER trg_notification_demande_status
  AFTER UPDATE ON demandes_mentorat
  FOR EACH ROW EXECUTE FUNCTION notify_etudiant_demande_status();

-- 6.5 Notification automatique — changement statut session
CREATE OR REPLACE FUNCTION notify_session_status_change()
RETURNS trigger AS $$
DECLARE
  type_notif    text;
  titre_notif   text;
  contenu_notif text;
  destinataire  uuid;
  expediteur    uuid;
BEGIN
  IF OLD.statut = NEW.statut THEN RETURN NEW; END IF;

  IF NEW.statut = 'acceptee' THEN
    type_notif    := 'session_programmee';
    titre_notif   := 'Séance confirmée';
    contenu_notif := CONCAT('Votre séance du ', NEW.date_session::text, ' a été acceptée.');
    destinataire  := NEW.mentore_id;
    expediteur    := NEW.mentor_id;
  ELSIF NEW.statut = 'annulee' THEN
    type_notif    := 'session_annulee';
    titre_notif   := 'Séance annulée';
    contenu_notif := CONCAT('La séance du ', NEW.date_session::text, ' a été annulée.');
    -- Notifier l'autre partie
    IF auth.uid() = NEW.mentor_id THEN
      destinataire := NEW.mentore_id;
      expediteur   := NEW.mentor_id;
    ELSE
      destinataire := NEW.mentor_id;
      expediteur   := NEW.mentore_id;
    END IF;
  ELSIF NEW.statut = 'terminee' THEN
    type_notif    := 'session_terminee';
    titre_notif   := 'Séance terminée — Évaluez !';
    contenu_notif := CONCAT('La séance du ', NEW.date_session::text, ' est terminée. Pensez à laisser une évaluation.');
    destinataire  := NEW.mentore_id;
    expediteur    := NEW.mentor_id;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (destinataire_id, expediteur_id, type, titre, contenu, lien, entite_type, entite_id)
  VALUES (
    destinataire,
    expediteur,
    type_notif,
    titre_notif,
    contenu_notif,
    CONCAT('/sessions/', NEW.id),
    'session',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_session_status ON sessions;
CREATE TRIGGER trg_notification_session_status
  AFTER UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION notify_session_status_change();

-- 6.6 Notification automatique — nouveau message (§20 CDC)
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger AS $$
DECLARE
  expediteur_nom text;
BEGIN
  SELECT CONCAT(p.prenom, ' ', p.nom) INTO expediteur_nom
  FROM profiles p WHERE p.id = NEW.expediteur_id;

  INSERT INTO notifications (destinataire_id, expediteur_id, type, titre, contenu, lien, entite_type, entite_id)
  VALUES (
    NEW.destinataire_id,
    NEW.expediteur_id,
    'nouveau_message',
    'Nouveau message',
    CONCAT(COALESCE(expediteur_nom, 'Quelqu''un'), ' vous a envoyé un message.'),
    CONCAT('/messages/', NEW.expediteur_id),
    'message',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_new_message ON messages;
CREATE TRIGGER trg_notification_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- ============================================================
-- 7. VUES SQL POUR STATISTIQUES (§23-24 CDC)
-- ============================================================

-- Vue : stats agrégées par mentor (utilisée par matching + tableau mentor)
CREATE OR REPLACE VIEW v_mentor_stats AS
SELECT
  p.id                                                AS mentor_id,
  p.nom,
  p.prenom,
  p.bio,
  p.photo_url,
  p.niveau_id,
  p.filiere_id,
  p.statut_validation,
  p.mode_preference,
  p.nb_etudiants_max,
  p.experience,
  -- Évaluations
  COUNT(DISTINCT e.id)                                AS nb_evaluations,
  COALESCE(AVG(COALESCE(e.note_globale, e.note::numeric)), 0) AS note_moyenne,
  -- Disponibilités
  COUNT(DISTINCT d.id)                                AS nb_disponibilites,
  -- Sessions
  COUNT(DISTINCT CASE WHEN s.statut = 'terminee' THEN s.id END) AS sessions_terminees,
  COUNT(DISTINCT CASE WHEN s.statut IN ('acceptee','confirmee','en_cours') THEN s.mentore_id END) AS etudiants_actifs,
  -- Demandes
  COUNT(DISTINCT dm.id)                               AS nb_demandes_recues
FROM profiles p
LEFT JOIN evaluations e ON e.evalue_id = p.id
LEFT JOIN disponibilites d ON d.mentor_id = p.id
LEFT JOIN sessions s ON s.mentor_id = p.id
LEFT JOIN demandes_mentorat dm ON dm.mentor_id = p.id
WHERE p.is_mentor = true
GROUP BY p.id, p.nom, p.prenom, p.bio, p.photo_url, p.niveau_id,
         p.filiere_id, p.statut_validation, p.mode_preference, p.nb_etudiants_max, p.experience;

-- Vue : tableau de bord admin (§23 CDC)
CREATE OR REPLACE VIEW v_admin_dashboard AS
SELECT
  -- Utilisateurs
  COUNT(DISTINCT CASE WHEN p.is_mentore AND NOT p.is_mentor THEN p.id END)      AS nb_etudiants,
  COUNT(DISTINCT CASE WHEN p.is_mentor THEN p.id END)                            AS nb_mentors,
  COUNT(DISTINCT CASE WHEN p.is_mentor AND p.statut_validation='valide' THEN p.id END) AS nb_mentors_valides,
  COUNT(DISTINCT CASE WHEN p.statut_validation='en_attente' THEN p.id END)       AS nb_en_attente_validation,
  COUNT(DISTINCT CASE WHEN p.is_admin THEN p.id END)                             AS nb_admins,
  -- Demandes
  COUNT(DISTINCT dm.id)                                                           AS nb_demandes_total,
  COUNT(DISTINCT CASE WHEN dm.statut='en_attente' THEN dm.id END)                AS nb_demandes_en_attente,
  COUNT(DISTINCT CASE WHEN dm.statut='acceptee' THEN dm.id END)                  AS nb_demandes_acceptees,
  COUNT(DISTINCT CASE WHEN dm.statut='refusee' THEN dm.id END)                   AS nb_demandes_refusees,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN dm.statut='acceptee' THEN dm.id END)
    / NULLIF(COUNT(DISTINCT dm.id), 0), 1
  )                                                                               AS taux_acceptation_pct,
  -- Sessions
  COUNT(DISTINCT s.id)                                                            AS nb_sessions_total,
  COUNT(DISTINCT CASE WHEN s.statut='terminee' THEN s.id END)                    AS nb_sessions_terminees,
  COUNT(DISTINCT CASE WHEN s.statut='annulee' THEN s.id END)                     AS nb_sessions_annulees,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN s.statut='annulee' THEN s.id END)
    / NULLIF(COUNT(DISTINCT s.id), 0), 1
  )                                                                               AS taux_annulation_pct,
  -- Évaluations
  ROUND(AVG(COALESCE(e.note_globale, e.note::numeric)), 2)                       AS note_moyenne_globale,
  COUNT(DISTINCT e.id)                                                            AS nb_evaluations,
  -- Signalements
  COUNT(DISTINCT CASE WHEN sig.statut='ouvert' THEN sig.id END)                  AS nb_signalements_ouverts,
  COUNT(DISTINCT CASE WHEN sig.statut='en_cours' THEN sig.id END)                AS nb_signalements_en_cours,
  -- Ressources
  COUNT(DISTINCT r.id)                                                            AS nb_ressources
FROM profiles p
LEFT JOIN demandes_mentorat dm ON true
LEFT JOIN sessions s ON true
LEFT JOIN evaluations e ON true
LEFT JOIN signalements sig ON true
LEFT JOIN ressources r ON true;

-- Vue : détails sessions enrichis
CREATE OR REPLACE VIEW v_session_details AS
SELECT
  s.id,
  s.date_session,
  s.heure_debut,
  s.heure_fin,
  s.mode,
  s.lieu_ou_lien,
  s.sujet,
  s.theme,
  s.statut,
  s.notes_mentor,
  s.created_at,
  s.updated_at,
  -- Mentor
  pm.id          AS mentor_id,
  pm.nom         AS mentor_nom,
  pm.prenom      AS mentor_prenom,
  pm.photo_url   AS mentor_photo,
  -- Mentoré
  pe.id          AS mentore_id,
  pe.nom         AS mentore_nom,
  pe.prenom      AS mentore_prenom,
  pe.photo_url   AS mentore_photo,
  -- Matière
  ma.id          AS matiere_id,
  ma.nom         AS matiere_nom,
  ma.code        AS matiere_code,
  -- Suivi
  sv.sujet_traite,
  sv.notions_abordees,
  sv.difficultes_observees,
  sv.niveau_comprehension_mentor,
  sv.niveau_comprehension_etudiant,
  sv.recommandations,
  sv.objectif_prochaine_seance,
  -- Évaluation
  ev.note_globale AS evaluation_note,
  ev.commentaire  AS evaluation_commentaire
FROM sessions s
JOIN profiles pm ON pm.id = s.mentor_id
JOIN profiles pe ON pe.id = s.mentore_id
JOIN matieres ma ON ma.id = s.matiere_id
LEFT JOIN suivi_seances sv ON sv.session_id = s.id
LEFT JOIN evaluations ev ON ev.session_id = s.id AND ev.evaluateur_id = s.mentore_id;

-- Vue : statistiques par matière (matières les plus demandées — §24 CDC)
CREATE OR REPLACE VIEW v_stats_matieres AS
SELECT
  ma.id,
  ma.nom,
  ma.code,
  COUNT(DISTINCT dm.id)                                          AS nb_demandes,
  COUNT(DISTINCT s.id)                                           AS nb_sessions,
  COUNT(DISTINCT CASE WHEN s.statut='terminee' THEN s.id END)   AS nb_sessions_terminees,
  ROUND(AVG(COALESCE(e.note_globale, e.note::numeric)), 2)       AS note_moyenne,
  COUNT(DISTINCT mm.mentor_id)                                   AS nb_mentors_actifs
FROM matieres ma
LEFT JOIN demandes_mentorat dm ON dm.matiere_id = ma.id
LEFT JOIN sessions s ON s.matiere_id = ma.id
LEFT JOIN evaluations e ON e.session_id = s.id
LEFT JOIN mentor_matieres mm ON mm.matiere_id = ma.id
GROUP BY ma.id, ma.nom, ma.code
ORDER BY nb_demandes DESC;

-- ============================================================
-- 8. RÈGLE DE GESTION — RG07 : Mentor suspendu bloqué (§25 CDC)
-- ============================================================

-- Fonction de vérification : empêche les demandes vers un mentor suspendu
CREATE OR REPLACE FUNCTION check_mentor_not_suspended()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = NEW.mentor_id AND p.statut_validation = 'suspendu'
  ) THEN
    RAISE EXCEPTION 'Ce mentor est suspendu et ne peut pas recevoir de nouvelles demandes (RG07)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_mentor_suspended ON demandes_mentorat;
CREATE TRIGGER trg_check_mentor_suspended
  BEFORE INSERT ON demandes_mentorat
  FOR EACH ROW EXECUTE FUNCTION check_mentor_not_suspended();

-- ============================================================
-- 9. CONTRAINTE RG10 — Un étudiant peut avoir plusieurs mentors
-- (déjà supporté par le schéma, mais on documente via un index)
-- ============================================================

-- Pas de contrainte UNIQUE sur (etudiant_id) dans demandes_mentorat
-- → un étudiant peut envoyer des demandes à plusieurs mentors (matières différentes)
-- La seule contrainte : une demande active par (étudiant, matière) à la fois
CREATE UNIQUE INDEX IF NOT EXISTS idx_demandes_etudiant_matiere_active
  ON demandes_mentorat (etudiant_id, matiere_id)
  WHERE statut IN ('en_attente', 'acceptee');

-- ============================================================
-- 10. COMMENTAIRES DE COLONNES (documentation auto Supabase)
-- ============================================================

COMMENT ON TABLE demandes_mentorat IS 'Demandes formelles de mentorat envoyées par un étudiant à un mentor (§13 CDC)';
COMMENT ON TABLE suivi_seances IS 'Rapport post-séance renseigné par le mentor et l''étudiant (§17 CDC)';
COMMENT ON TABLE ressources IS 'Ressources pédagogiques partagées par les mentors (§18 CDC)';
COMMENT ON TABLE notifications IS 'Notifications internes de la plateforme (§20 CDC)';
COMMENT ON TABLE signalements IS 'Signalements de contenu ou comportements inappropriés (§35 CDC)';
COMMENT ON COLUMN evaluations.note_globale IS 'Moyenne des 5 critères calculée automatiquement par trigger';
COMMENT ON COLUMN evaluations.qualite_pedagogique IS 'Critère 1/5 : qualité pédagogique (1-5)';
COMMENT ON COLUMN evaluations.ponctualite IS 'Critère 2/5 : ponctualité du mentor (1-5)';
COMMENT ON COLUMN evaluations.clarte_explications IS 'Critère 3/5 : clarté des explications (1-5)';
COMMENT ON COLUMN evaluations.disponibilite_mentor IS 'Critère 4/5 : disponibilité du mentor (1-5)';
COMMENT ON COLUMN evaluations.satisfaction_generale IS 'Critère 5/5 : satisfaction générale (1-5)';
COMMENT ON COLUMN profiles.nb_etudiants_max IS 'Nombre max d''étudiants simultanés pour ce mentor (RG — contre surcharge)';
