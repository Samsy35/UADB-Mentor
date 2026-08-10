/*
# Seed admin account + 6 test mentors for simulation

1. Purpose
- Create an administrator account so the admin can log in and approve student registrations.
- Create 6 test mentor profiles (with matières and disponibilités) so the "Trouver un mentor" page has data.
- Uses existing filières, niveaux, matières already in the database.

2. Security
- Admin profile has is_admin = true and statut_validation = 'valide'.
- Mentor profiles have statut_validation = 'valide', is_mentor = true.
- No RLS policy changes.

3. Data safety
- All inserts use ON CONFLICT DO NOTHING / IF NOT EXISTS so re-running is safe.
- No tables, columns, or existing rows are deleted.

4. Credentials
- Admin: admin@uadb.edu.sn / AdminUADB2026!
- Mentors (all password: Mentor2026!):
  awa.diop@uadb.edu.sn, mamadou.sarr@uadb.edu.sn, fatou.ndiaye@uadb.edu.sn,
  cheikh.fall@uadb.edu.sn, aminata.ba@uadb.edu.sn, ousmane.diallo@uadb.edu.sn
*/

-- Helper: create auth user (pgcrypto is in "extensions" schema; confirmed_at is generated)
CREATE OR REPLACE FUNCTION _create_auth_user(p_email text, p_password text, p_meta jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = auth, public, extensions AS $$
DECLARE new_id uuid;
BEGIN
  SELECT id INTO new_id FROM auth.users WHERE email = p_email;
  IF new_id IS NOT NULL THEN RETURN new_id; END IF;
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    is_sso_user, is_anonymous
  ) VALUES (
    gen_random_uuid(), p_email, crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '{}'::jsonb, p_meta,
    'authenticated', 'authenticated', false, false
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- ============================================================
-- ADMIN ACCOUNT
-- ============================================================
DO $$
DECLARE admin_id uuid;
BEGIN
  admin_id := _create_auth_user('admin@uadb.edu.sn', 'AdminUADB2026!',
    jsonb_build_object('nom','Admin','prenom','UADB','numero_carte','ADMIN-001','telephone','770000000'));
  INSERT INTO profiles (id, nom, prenom, numero_carte, telephone, is_mentor, is_mentore, is_admin, statut_validation, bio)
  VALUES (admin_id, 'UADB', 'Admin', 'ADMIN-001', '770000000', false, false, true, 'valide', 'Administrateur de la plateforme MentorUADB')
  ON CONFLICT (id) DO UPDATE SET is_admin = true, statut_validation = 'valide';
END $$;

-- ============================================================
-- TEST MENTOR ACCOUNTS
-- Filière IDs: SATIC-MATHS=8106ef88, SATIC-TIC=03ff167d, SDD-SANTE=e4cea898,
--   ECOMIJ-ECO=e72215ca, ISFAR-AGRI=125470b9, SATIC-PHYSIQUE=63121838
-- Niveau IDs: L2=1971202a, L3=1649ecb8, M1=4c18e056
-- ============================================================
DO $$
DECLARE
  m_id uuid;
  satic_maths uuid := '8106ef88-9716-4a10-b10b-42bc80800598';
  satic_tic uuid := '03ff167d-f9e8-40f1-b689-f6b65c31e05e';
  sdd_sante uuid := 'e4cea898-5363-4443-8bca-a31ebe24389c';
  ecomij_eco uuid := 'e72215ca-a089-432b-a2c5-ab4f78d5a900';
  isfar_agri uuid := '125470b9-a651-4654-b1cb-1ea4a6021c56';
  satic_phys uuid := '63121838-d387-4cfc-8a0d-0f65c8528abe';
  l2_id uuid := '1971202a-5b4f-491e-a201-176e998c3ab4';
  l3_id uuid := '1649ecb8-1110-4ef4-9a6c-40bee1b41c03';
  m1_id uuid := '4c18e056-1f7f-4832-a5ec-c9320982fd4f';
BEGIN
  -- Awa Diop — L3 Maths
  m_id := _create_auth_user('awa.diop@uadb.edu.sn', 'Mentor2026!',
    jsonb_build_object('nom','Diop','prenom','Awa','numero_carte','UADB-SATIC-001','telephone','771234561','is_mentor','true','is_mentore','false'));
  INSERT INTO profiles (id, nom, prenom, numero_carte, telephone, niveau_id, filiere_id, is_mentor, is_mentore, is_admin, statut_validation, bio, photo_url)
  VALUES (m_id,'Diop','Awa','UADB-SATIC-001','771234561',l3_id,satic_maths,true,false,false,'valide','Étudiante en L3 Maths, passionnée par l''enseignement de l''analyse et de l''algèbre.','https://images.pexels.com/photos/5537535/pexels-photo-5537535.jpeg?auto=compress&cs=tinysrgb&w=400')
  ON CONFLICT (id) DO UPDATE SET is_mentor=true, statut_validation='valide', niveau_id=l3_id, filiere_id=satic_maths;

  -- Mamadou Sarr — L3 TIC
  m_id := _create_auth_user('mamadou.sarr@uadb.edu.sn', 'Mentor2026!',
    jsonb_build_object('nom','Sarr','prenom','Mamadou','numero_carte','UADB-SATIC-002','telephone','771234562','is_mentor','true','is_mentore','false'));
  INSERT INTO profiles (id, nom, prenom, numero_carte, telephone, niveau_id, filiere_id, is_mentor, is_mentore, is_admin, statut_validation, bio, photo_url)
  VALUES (m_id,'Sarr','Mamadou','UADB-SATIC-002','771234562',l3_id,satic_tic,true,false,false,'valide','Développeur en herbe, mentor en algorithmique et développement web.','https://images.pexels.com/photos/6238089/pexels-photo-6238089.jpeg?auto=compress&cs=tinysrgb&w=400')
  ON CONFLICT (id) DO UPDATE SET is_mentor=true, statut_validation='valide', niveau_id=l3_id, filiere_id=satic_tic;

  -- Fatou Ndiaye — L2 Santé
  m_id := _create_auth_user('fatou.ndiaye@uadb.edu.sn', 'Mentor2026!',
    jsonb_build_object('nom','Ndiaye','prenom','Fatou','numero_carte','UADB-SDD-001','telephone','771234563','is_mentor','true','is_mentore','false'));
  INSERT INTO profiles (id, nom, prenom, numero_carte, telephone, niveau_id, filiere_id, is_mentor, is_mentore, is_admin, statut_validation, bio, photo_url)
  VALUES (m_id,'Ndiaye','Fatou','UADB-SDD-001','771234563',l2_id,sdd_sante,true,false,false,'valide','Mentor en santé communautaire et environnement.','https://images.pexels.com/photos/6684444/pexels-photo-6684444.jpeg?auto=compress&cs=tinysrgb&w=400')
  ON CONFLICT (id) DO UPDATE SET is_mentor=true, statut_validation='valide', niveau_id=l2_id, filiere_id=sdd_sante;

  -- Cheikh Fall — L3 Éco
  m_id := _create_auth_user('cheikh.fall@uadb.edu.sn', 'Mentor2026!',
    jsonb_build_object('nom','Fall','prenom','Cheikh','numero_carte','UADB-ECOMIJ-001','telephone','771234564','is_mentor','true','is_mentore','false'));
  INSERT INTO profiles (id, nom, prenom, numero_carte, telephone, niveau_id, filiere_id, is_mentor, is_mentore, is_admin, statut_validation, bio, photo_url)
  VALUES (m_id,'Fall','Cheikh','UADB-ECOMIJ-001','771234564',l3_id,ecomij_eco,true,false,false,'valide','Mentor en économie, comptabilité et management.','https://images.pexels.com/photos/6371804/pexels-photo-6371804.jpeg?auto=compress&cs=tinysrgb&w=400')
  ON CONFLICT (id) DO UPDATE SET is_mentor=true, statut_validation='valide', niveau_id=l3_id, filiere_id=ecomij_eco;

  -- Aminata Ba — M1 Agronomie
  m_id := _create_auth_user('aminata.ba@uadb.edu.sn', 'Mentor2026!',
    jsonb_build_object('nom','Ba','prenom','Aminata','numero_carte','UADB-ISFAR-001','telephone','771234565','is_mentor','true','is_mentore','false'));
  INSERT INTO profiles (id, nom, prenom, numero_carte, telephone, niveau_id, filiere_id, is_mentor, is_mentore, is_admin, statut_validation, bio, photo_url)
  VALUES (m_id,'Ba','Aminata','UADB-ISFAR-001','771234565',m1_id,isfar_agri,true,false,false,'valide','Mentor en agronomie et élevage, future ingénieure agronome.','https://images.pexels.com/photos/5537530/pexels-photo-5537530.jpeg?auto=compress&cs=tinysrgb&w=400')
  ON CONFLICT (id) DO UPDATE SET is_mentor=true, statut_validation='valide', niveau_id=m1_id, filiere_id=isfar_agri;

  -- Ousmane Diallo — L3 Physique
  m_id := _create_auth_user('ousmane.diallo@uadb.edu.sn', 'Mentor2026!',
    jsonb_build_object('nom','Diallo','prenom','Ousmane','numero_carte','UADB-SATIC-003','telephone','771234566','is_mentor','true','is_mentore','false'));
  INSERT INTO profiles (id, nom, prenom, numero_carte, telephone, niveau_id, filiere_id, is_mentor, is_mentore, is_admin, statut_validation, bio, photo_url)
  VALUES (m_id,'Diallo','Ousmane','UADB-SATIC-003','771234566',l3_id,satic_phys,true,false,false,'valide','Mentor en physique et réseaux, passionné de sciences appliquées.','https://images.pexels.com/photos/6609375/pexels-photo-6609375.jpeg?auto=compress&cs=tinysrgb&w=400')
  ON CONFLICT (id) DO UPDATE SET is_mentor=true, statut_validation='valide', niveau_id=l3_id, filiere_id=satic_phys;
END $$;

-- ============================================================
-- MENTOR-MATIÈRE RELATIONS + DISPONIBILITÉS
-- Matière IDs:
--   Analyse Mathématique=bbdfdcb6, Algèbre Linéaire=f79f4ffd
--   Algorithmique=6f0729d3, Développement Web=ce1fdd80
--   Santé Publique=c951c191, Santé et Environnement=64e58b57
--   Économétrie=e409e5c2, Comptabilité Générale=7a45b0b6, Management=4274507c
--   Agronomie=8088359a, Zootechnie=cb5642fc
--   Mécanique=85eac65a, Électricité=af14f518, Admin Réseaux=1d97ca1d
-- ============================================================
DO $$
DECLARE
  awa_id uuid := (SELECT id FROM profiles WHERE numero_carte = 'UADB-SATIC-001');
  mamadou_id uuid := (SELECT id FROM profiles WHERE numero_carte = 'UADB-SATIC-002');
  fatou_id uuid := (SELECT id FROM profiles WHERE numero_carte = 'UADB-SDD-001');
  cheikh_id uuid := (SELECT id FROM profiles WHERE numero_carte = 'UADB-ECOMIJ-001');
  aminata_id uuid := (SELECT id FROM profiles WHERE numero_carte = 'UADB-ISFAR-001');
  ousmane_id uuid := (SELECT id FROM profiles WHERE numero_carte = 'UADB-SATIC-003');
BEGIN
  -- Awa: Analyse + Algèbre
  INSERT INTO mentor_matieres (mentor_id, matiere_id, niveau_expertise) VALUES
    (awa_id, 'bbdfdcb6-7c43-40bb-8c2b-39bbf1e7627e', 'expert'),
    (awa_id, 'f79f4ffd-c00b-4b9a-ae43-27c2f3330f89', 'intermediaire')
  ON CONFLICT (mentor_id, matiere_id) DO NOTHING;

  -- Mamadou: Algo + Web
  INSERT INTO mentor_matieres (mentor_id, matiere_id, niveau_expertise) VALUES
    (mamadou_id, '6f0729d3-cb0a-4378-86da-64c2e8dff7d6', 'expert'),
    (mamadou_id, 'ce1fdd80-7334-4828-8c02-a96c6039e7f7', 'expert')
  ON CONFLICT (mentor_id, matiere_id) DO NOTHING;

  -- Fatou: Santé Publique + Santé et Environnement
  INSERT INTO mentor_matieres (mentor_id, matiere_id, niveau_expertise) VALUES
    (fatou_id, 'c951c191-4d0e-4d1e-bc6d-893679d35395', 'expert'),
    (fatou_id, '64e58b57-33d1-46f4-85f6-efaa6cdcc5a9', 'intermediaire')
  ON CONFLICT (mentor_id, matiere_id) DO NOTHING;

  -- Cheikh: Économétrie + Comptabilité + Management
  INSERT INTO mentor_matieres (mentor_id, matiere_id, niveau_expertise) VALUES
    (cheikh_id, 'e409e5c2-92e4-4b4d-a4f5-9acc6e7e106c', 'expert'),
    (cheikh_id, '7a45b0b6-0f8e-46c5-b843-00cd5ec069ea', 'expert'),
    (cheikh_id, '4274507c-cd27-4aa9-8738-01b68b961e97', 'intermediaire')
  ON CONFLICT (mentor_id, matiere_id) DO NOTHING;

  -- Aminata: Agronomie + Zootechnie
  INSERT INTO mentor_matieres (mentor_id, matiere_id, niveau_expertise) VALUES
    (aminata_id, '8088359a-6aed-4169-b1f1-151bcc43c9ec', 'expert'),
    (aminata_id, 'cb5642fc-de19-4438-aeab-bb6884f92ec8', 'intermediaire')
  ON CONFLICT (mentor_id, matiere_id) DO NOTHING;

  -- Ousmane: Mécanique + Électricité + Admin Réseaux
  INSERT INTO mentor_matieres (mentor_id, matiere_id, niveau_expertise) VALUES
    (ousmane_id, '85eac65a-f8e9-4c33-829a-87f774e1652b', 'expert'),
    (ousmane_id, 'af14f518-33ae-4076-9da4-2e59b9b4ae9e', 'intermediaire'),
    (ousmane_id, '1d97ca1d-8b81-4820-b194-6218296acece', 'expert')
  ON CONFLICT (mentor_id, matiere_id) DO NOTHING;

  -- Disponibilités (0=Dim, 1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam)
  INSERT INTO disponibilites (mentor_id, jour_semaine, heure_debut, heure_fin, mode) VALUES
    (awa_id, 1, '14:00', '16:00', 'les_deux'),
    (awa_id, 3, '10:00', '12:00', 'en_ligne')
  ON CONFLICT DO NOTHING;

  INSERT INTO disponibilites (mentor_id, jour_semaine, heure_debut, heure_fin, mode) VALUES
    (mamadou_id, 2, '15:00', '18:00', 'en_ligne'),
    (mamadou_id, 4, '15:00', '17:00', 'en_ligne'),
    (mamadou_id, 6, '09:00', '12:00', 'presentiel')
  ON CONFLICT DO NOTHING;

  INSERT INTO disponibilites (mentor_id, jour_semaine, heure_debut, heure_fin, mode) VALUES
    (fatou_id, 3, '13:00', '15:00', 'les_deux'),
    (fatou_id, 5, '09:00', '11:00', 'en_ligne')
  ON CONFLICT DO NOTHING;

  INSERT INTO disponibilites (mentor_id, jour_semaine, heure_debut, heure_fin, mode) VALUES
    (cheikh_id, 1, '09:00', '12:00', 'presentiel'),
    (cheikh_id, 4, '14:00', '17:00', 'les_deux')
  ON CONFLICT DO NOTHING;

  INSERT INTO disponibilites (mentor_id, jour_semaine, heure_debut, heure_fin, mode) VALUES
    (aminata_id, 2, '10:00', '13:00', 'presentiel'),
    (aminata_id, 5, '14:00', '16:00', 'les_deux')
  ON CONFLICT DO NOTHING;

  INSERT INTO disponibilites (mentor_id, jour_semaine, heure_debut, heure_fin, mode) VALUES
    (ousmane_id, 3, '15:00', '18:00', 'les_deux'),
    (ousmane_id, 6, '10:00', '13:00', 'en_ligne')
  ON CONFLICT DO NOTHING;
END $$;

DROP FUNCTION IF EXISTS _create_auth_user(text, text, jsonb);