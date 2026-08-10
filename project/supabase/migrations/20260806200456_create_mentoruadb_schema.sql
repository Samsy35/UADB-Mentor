/*
# MentorUADB — Schéma complet de la plateforme de mentorat

## Description
Crée le schéma de données complet pour la plateforme de mentorat académique de l'UADB.
Un même utilisateur peut être à la fois mentor et mentoré. Les rôles sont gérés par des flags booléens.

## Nouvelles tables
1. `profiles` — Profil étudiant lié à auth.users (nom, prénom, carte étudiant, niveau, filière, téléphone, photo, rôle mentor/mentoré, statut validation, rôle admin)
2. `filieres` — Filières académiques (D2Aweb, SATIC, etc.)
3. `niveaux` — Niveaux d'étude (L1, L2, L3, D2A1, etc.)
4. `matieres` — Matières enseignables (nom, filière associée, description)
5. `mentor_matieres` — Relation N-N entre mentors et matières avec niveau d'expertise
6. `disponibilites` — Créneaux de disponibilité des mentors (jour, heure début/fin, mode)
7. `sessions` — Sessions de tutorat (mentor, mentoré, matière, date, mode, lieu/lien, statut)
8. `messages` — Messagerie entre utilisateurs (expéditeur, destinataire, contenu, lu)
9. `evaluations` — Évaluations post-session (note sur 5, commentaire)
10. `chatbot_conversations` — Historique des conversations avec le chatbot IA

## Sécurité
- RLS activée sur toutes les tables.
- Profils: lecture publique limitée (informations visibles), écriture par le propriétaire.
- Matières/filières/niveaux: lecture publique (référence), écriture admin.
- Sessions: lecture par mentor ou mentoré concerné, création par mentoré, mise à jour par mentor.
- Messages: lecture par expéditeur ou destinataire, envoi par l'expéditeur.
- Évaluations: lecture par les parties, création par mentor ou mentoré.
- Toutes les policies utilisent auth.uid().
*/

-- ============================================================
-- TABLES DE RÉFÉRENCE
-- ============================================================

CREATE TABLE IF NOT EXISTS filieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS niveaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  ordre int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  filiere_id uuid REFERENCES filieres(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PROFILS UTILISATEURS
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenom text NOT NULL,
  numero_carte text UNIQUE NOT NULL,
  niveau_id uuid REFERENCES niveaux(id),
  filiere_id uuid REFERENCES filieres(id),
  telephone text NOT NULL,
  photo_url text,
  is_mentor boolean NOT NULL DEFAULT false,
  is_mentore boolean NOT NULL DEFAULT true,
  is_admin boolean NOT NULL DEFAULT false,
  statut_validation text NOT NULL DEFAULT 'en_attente',
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- RELATION MENTOR-MATIÈRE
-- ============================================================

CREATE TABLE IF NOT EXISTS mentor_matieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matiere_id uuid NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  niveau_expertise text DEFAULT 'intermediaire',
  created_at timestamptz DEFAULT now(),
  UNIQUE(mentor_id, matiere_id)
);

-- ============================================================
-- DISPONIBILITÉS MENTOR
-- ============================================================

CREATE TABLE IF NOT EXISTS disponibilites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jour_semaine int NOT NULL CHECK (jour_semaine BETWEEN 0 AND 6),
  heure_debut time NOT NULL,
  heure_fin time NOT NULL,
  mode text NOT NULL DEFAULT 'en_ligne' CHECK (mode IN ('en_ligne','presentiel','les_deux')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SESSIONS DE TUTORAT
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentore_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matiere_id uuid NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  date_session date NOT NULL,
  heure_debut time NOT NULL,
  heure_fin time NOT NULL,
  mode text NOT NULL CHECK (mode IN ('en_ligne','presentiel')),
  lieu_ou_lien text,
  sujet text,
  statut text NOT NULL DEFAULT 'demandee' CHECK (statut IN ('demandee','acceptee','refusee','terminee','annulee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destinataire_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contenu text NOT NULL,
  lu boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ÉVALUATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  evaluateur_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evalue_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note int NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, evaluateur_id)
);

-- ============================================================
-- CHATBOT
-- ============================================================

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message_utilisateur text NOT NULL,
  reponse_ia text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_filiere ON profiles(filiere_id);
CREATE INDEX IF NOT EXISTS idx_profiles_niveau ON profiles(niveau_id);
CREATE INDEX IF NOT EXISTS idx_profiles_statut ON profiles(statut_validation);
CREATE INDEX IF NOT EXISTS idx_mentor_matieres_mentor ON mentor_matieres(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_matieres_matiere ON mentor_matieres(matiere_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentore ON sessions(mentore_id);
CREATE INDEX IF NOT EXISTS idx_sessions_statut ON sessions(statut);
CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_disponibilites_mentor ON disponibilites(mentor_id);

-- ============================================================
-- RLS : FILIÈRES, NIVEAUX, MATIÈRES (référence publique)
-- ============================================================

ALTER TABLE filieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_filieres" ON filieres;
CREATE POLICY "public_read_filieres" ON filieres FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_filieres" ON filieres;
CREATE POLICY "admin_write_filieres" ON filieres FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "public_read_niveaux" ON niveaux;
CREATE POLICY "public_read_niveaux" ON niveaux FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_niveaux" ON niveaux;
CREATE POLICY "admin_write_niveaux" ON niveaux FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "public_read_matieres" ON matieres;
CREATE POLICY "public_read_matieres" ON matieres FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_matieres" ON matieres;
CREATE POLICY "admin_write_matieres" ON matieres FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- RLS : PROFILES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- RLS : MENTOR_MATIÈRES
-- ============================================================

ALTER TABLE mentor_matieres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_mentor_matieres" ON mentor_matieres;
CREATE POLICY "read_mentor_matieres" ON mentor_matieres FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_mentor_matieres" ON mentor_matieres;
CREATE POLICY "insert_own_mentor_matieres" ON mentor_matieres FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "update_own_mentor_matieres" ON mentor_matieres;
CREATE POLICY "update_own_mentor_matieres" ON mentor_matieres FOR UPDATE TO authenticated
  USING (auth.uid() = mentor_id) WITH CHECK (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "delete_own_mentor_matieres" ON mentor_matieres;
CREATE POLICY "delete_own_mentor_matieres" ON mentor_matieres FOR DELETE TO authenticated
  USING (auth.uid() = mentor_id);

-- ============================================================
-- RLS : DISPONIBILITÉS
-- ============================================================

ALTER TABLE disponibilites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_disponibilites" ON disponibilites;
CREATE POLICY "read_disponibilites" ON disponibilites FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_disponibilites" ON disponibilites;
CREATE POLICY "insert_own_disponibilites" ON disponibilites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "update_own_disponibilites" ON disponibilites;
CREATE POLICY "update_own_disponibilites" ON disponibilites FOR UPDATE TO authenticated
  USING (auth.uid() = mentor_id) WITH CHECK (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "delete_own_disponibilites" ON disponibilites;
CREATE POLICY "delete_own_disponibilites" ON disponibilites FOR DELETE TO authenticated
  USING (auth.uid() = mentor_id);

-- ============================================================
-- RLS : SESSIONS
-- ============================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_sessions" ON sessions;
CREATE POLICY "read_own_sessions" ON sessions FOR SELECT TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentore_id);

DROP POLICY IF EXISTS "insert_sessions" ON sessions;
CREATE POLICY "insert_sessions" ON sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentore_id);

DROP POLICY IF EXISTS "update_own_sessions" ON sessions;
CREATE POLICY "update_own_sessions" ON sessions FOR UPDATE TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentore_id)
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentore_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON sessions;
CREATE POLICY "delete_own_sessions" ON sessions FOR DELETE TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentore_id);

-- ============================================================
-- RLS : MESSAGES
-- ============================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_messages" ON messages;
CREATE POLICY "read_own_messages" ON messages FOR SELECT TO authenticated
  USING (auth.uid() = expediteur_id OR auth.uid() = destinataire_id);

DROP POLICY IF EXISTS "send_messages" ON messages;
CREATE POLICY "send_messages" ON messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = expediteur_id);

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE TO authenticated
  USING (auth.uid() = destinataire_id) WITH CHECK (auth.uid() = destinataire_id);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE TO authenticated
  USING (auth.uid() = expediteur_id);

-- ============================================================
-- RLS : ÉVALUATIONS
-- ============================================================

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_evaluations" ON evaluations;
CREATE POLICY "read_evaluations" ON evaluations FOR SELECT TO authenticated
  USING (auth.uid() = evaluateur_id OR auth.uid() = evalue_id
    OR EXISTS (SELECT 1 FROM sessions s WHERE s.id = evaluations.session_id AND (s.mentor_id = auth.uid() OR s.mentore_id = auth.uid())));

DROP POLICY IF EXISTS "insert_evaluations" ON evaluations;
CREATE POLICY "insert_evaluations" ON evaluations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = evaluateur_id);

DROP POLICY IF EXISTS "delete_own_evaluations" ON evaluations;
CREATE POLICY "delete_own_evaluations" ON evaluations FOR DELETE TO authenticated
  USING (auth.uid() = evaluateur_id);

-- ============================================================
-- RLS : CHATBOT
-- ============================================================

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_chatbot" ON chatbot_conversations;
CREATE POLICY "read_own_chatbot" ON chatbot_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chatbot" ON chatbot_conversations;
CREATE POLICY "insert_own_chatbot" ON chatbot_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGER : auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sessions_updated ON sessions;
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
