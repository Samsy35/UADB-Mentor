/* MentorUADB — catalogue académique UADB + gouvernance des mentors
   Source catalogue : pages officielles UADB/IFOAD consultées le 11/08/2026.
   Objectifs :
   - structurer UFR -> filière -> matière -> niveau;
   - filtrer l'inscription et la recherche de mentors par filière;
   - empêcher un compte admin d'être mentor/mentoré;
   - exiger un niveau >= L2 et une validation admin avant toute activité mentor;
   - sécuriser les matières et disponibilités des mentors non validés.
*/

CREATE TABLE IF NOT EXISTS ufrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  type text NOT NULL DEFAULT 'UFR',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE filieres ADD COLUMN IF NOT EXISTS ufr_id uuid REFERENCES ufrs(id) ON DELETE SET NULL;
ALTER TABLE matieres ADD COLUMN IF NOT EXISTS ufr_id uuid REFERENCES ufrs(id) ON DELETE SET NULL;
ALTER TABLE matieres ADD COLUMN IF NOT EXISTS actif boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS filiere_niveaux (
  filiere_id uuid NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  niveau_id uuid NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
  PRIMARY KEY (filiere_id, niveau_id)
);

CREATE TABLE IF NOT EXISTS matiere_niveaux (
  matiere_id uuid NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  niveau_id uuid NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
  PRIMARY KEY (matiere_id, niveau_id)
);

CREATE INDEX IF NOT EXISTS idx_filieres_ufr ON filieres(ufr_id);
CREATE INDEX IF NOT EXISTS idx_matieres_ufr ON matieres(ufr_id);
CREATE INDEX IF NOT EXISTS idx_matiere_niveaux_niveau ON matiere_niveaux(niveau_id);
CREATE INDEX IF NOT EXISTS idx_filiere_niveaux_niveau ON filiere_niveaux(niveau_id);

-- Niveaux LMD + médecine. ordre >= 2 signifie au minimum L2.
INSERT INTO niveaux (id, code, nom, ordre) VALUES
 ('11111111-1111-4111-8111-111111111111','L1','Licence 1',1),
 ('1971202a-5b4f-491e-a201-176e998c3ab4','L2','Licence 2',2),
 ('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','L3','Licence 3',3),
 ('4c18e056-1f7f-4832-a5ec-c9320982fd4f','M1','Master 1',4),
 ('55555555-5555-4555-8555-555555555555','M2','Master 2',5),
 ('66666666-6666-4666-8666-666666666661','D1','Doctorat 1 / Médecine D1',6),
 ('66666666-6666-4666-8666-666666666662','D2','Doctorat 2 / Médecine D2',7),
 ('66666666-6666-4666-8666-666666666663','D3','Doctorat 3 / Médecine D3',8),
 ('66666666-6666-4666-8666-666666666664','D4','Doctorat 4 / Médecine D4',9),
 ('66666666-6666-4666-8666-666666666665','D5','Doctorat 5 / Médecine D5',10),
 ('66666666-6666-4666-8666-666666666666','D6','Doctorat 6 / Médecine D6',11),
 ('66666666-6666-4666-8666-666666666667','D7','Doctorat 7 / Médecine D7',12),
 ('66666666-6666-4666-8666-666666666668','D8','Doctorat 8 / Médecine D8',13)
ON CONFLICT (id) DO UPDATE SET code=excluded.code, nom=excluded.nom, ordre=excluded.ordre;

INSERT INTO ufrs (id, code, nom, type, description) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','SATIC','Sciences Appliquées et Technologies de l’Information et de la Communication','UFR','Départements de Chimie, TIC, Mathématiques et Physique.'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','SDD','Santé et Développement Durable','UFR','Départements de Médecine, Santé communautaire et Développement durable.'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','ECOMIJ','Économie, Management et Ingénierie Juridique','UFR','Départements d’Économie, Management et Ingénierie juridique.'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','ISFAR','Institut Supérieur de Formation Agricole et Rurale','Institut','Formations agricoles, élevage, eaux et forêts, conseil agricole et développement rural.')
ON CONFLICT (id) DO UPDATE SET nom=excluded.nom, type=excluded.type, description=excluded.description;

-- Filières/licences officielles principales publiées par l'UADB.
INSERT INTO filieres (id, code, nom, description, ufr_id) VALUES
 ('8106ef88-9716-4a10-b10b-42bc80800598','SATIC-MATHS','Mathématiques','Licence Mathématiques / parcours scientifique.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('03ff167d-f9e8-40f1-b689-f6b65c31e05e','SATIC-SID','Statistiques et Informatiques Décisionnelles','Licence SID.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('e0a0a001-0001-4001-8001-000000000001','SATIC-CA','Chimie Appliquée','Licence Chimie Appliquée.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('63121838-d387-4cfc-8a0d-0f65c8528abe','SATIC-PC','Physique-Chimie','Licence Physique-Chimie.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('e0a0a001-0001-4001-8001-000000000002','SATIC-AMRT','Administration et Maintenance des Réseaux Téléinformatiques','Licence AMRT.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('e0a0a001-0001-4001-8001-000000000003','SATIC-D2AW','Développement et Administration des Applications Web','Licence D2AW.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('e0a0a001-0001-4001-8001-000000000004','SATIC-LPCM','Licence Professionnelle en Création Multimédia','LPCM.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('e0a0a001-0001-4001-8001-000000000005','SATIC-PN','Physique Numérique','Licence Physique Numérique.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('e4cea898-5363-4443-8bca-a31ebe24389c','SDD-SANTE','Santé Communautaire','Licence Santé Communautaire.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
 ('e0a0a002-0001-4001-8001-000000000001','SDD-DDME','Développement Durable et Management de l’Environnement','Licence DDME.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
 ('e0a0a002-0001-4001-8001-000000000002','SDD-AGRI-DD','Agriculture et Développement Durable','Licence professionnelle.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
 ('e0a0a002-0001-4001-8001-000000000003','SDD-RSE-SANTE','Responsabilité Sociétale des Entreprises / Santé','Formation publiée dans l’offre SDD.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
 ('e0a0a002-0001-4001-8001-000000000004','SDD-MEDECINE','Médecine','Doctorat en Médecine.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
 ('e72215ca-a089-432b-a2c5-ab4f78d5a900','ECOMIJ-ECO','Économie Appliquée','Licence Économie.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
 ('e0a0a003-0001-4001-8001-000000000001','ECOMIJ-FC','Finance Comptabilité','Licence Finance Comptabilité.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
 ('e0a0a003-0001-4001-8001-000000000002','ECOMIJ-MRO','Management Responsable des Organisations','Licence Management.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
 ('e0a0a003-0001-4001-8001-000000000003','ECOMIJ-AP','Administration Publique','Licence Ingénierie juridique.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
 ('e0a0a003-0001-4001-8001-000000000004','ECOMIJ-JA','Juriste d’Affaires','Licence Ingénierie juridique.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
 ('e0a0a003-0001-4001-8001-000000000005','ECOMIJ-CEC','Commerce Électronique et Cyber-sécurité','Licence Ingénierie juridique.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
 ('e0a0a003-0001-4001-8001-000000000006','ECOMIJ-MJEF','Management Juridique Environnemental et Foncier','Licence Ingénierie juridique.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
 ('125470b9-a651-4654-b1cb-1ea4a6021c56','ISFAR-AGRI','Sciences agronomiques – spécialité Agriculture','Cycle Ingénieur des Travaux agricoles.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'),
 ('e0a0a004-0001-4001-8001-000000000001','ISFAR-ELEVAGE','Sciences agronomiques – spécialité Élevage','Cycle Ingénieur des Travaux d’élevage.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'),
 ('e0a0a004-0001-4001-8001-000000000002','ISFAR-EF','Sciences agronomiques – spécialité Eaux et Forêts','Cycle Ingénieur des Travaux des Eaux et Forêts.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'),
 ('e0a0a004-0001-4001-8001-000000000003','ISFAR-CAR','Conseil agricole et rural','Licence professionnelle.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4')
ON CONFLICT (id) DO UPDATE SET nom=excluded.nom, description=excluded.description, ufr_id=excluded.ufr_id;

-- Rattacher les anciennes filières connues aux UFR.
UPDATE filieres SET ufr_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' WHERE code LIKE 'SATIC-%' AND ufr_id IS NULL;
UPDATE filieres SET ufr_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' WHERE code LIKE 'SDD-%' AND ufr_id IS NULL;
UPDATE filieres SET ufr_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3' WHERE code LIKE 'ECOMIJ-%' AND ufr_id IS NULL;
UPDATE filieres SET ufr_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4' WHERE code LIKE 'ISFAR-%' AND ufr_id IS NULL;

-- Associations niveaux/filières : licence L1-L3 pour les licences, M1-M2 pour les masters.
INSERT INTO filiere_niveaux (filiere_id,niveau_id)
SELECT f.id,n.id FROM filieres f CROSS JOIN niveaux n
WHERE f.code IN ('SATIC-MATHS','SATIC-SID','SATIC-CA','SATIC-PC','SATIC-AMRT','SATIC-D2AW','SATIC-LPCM','SATIC-PN','SDD-SANTE','SDD-DDME','SDD-AGRI-DD','SDD-RSE-SANTE','ECOMIJ-ECO','ECOMIJ-FC','ECOMIJ-MRO','ECOMIJ-AP','ECOMIJ-JA','ECOMIJ-CEC','ECOMIJ-MJEF','ISFAR-AGRI','ISFAR-ELEVAGE','ISFAR-EF','ISFAR-CAR')
AND n.code IN ('L1','L2','L3') ON CONFLICT DO NOTHING;
INSERT INTO filiere_niveaux (filiere_id,niveau_id)
SELECT f.id,n.id FROM filieres f CROSS JOIN niveaux n
WHERE f.code IN ('SDD-MEDECINE') AND n.code IN ('D1','D2','D3','D4','D5','D6','D7','D8') ON CONFLICT DO NOTHING;

-- Catalogue de matières : matières officielles / explicitement publiées dans les maquettes UADB et la plateforme IFOAD.
-- On ne fabrique pas de matières non documentées : l'administration peut compléter le catalogue.
INSERT INTO matieres (id,code,nom,filiere_id,ufr_id,description,niveau_id,actif) VALUES
 ('bbdfdcb6-7c43-40bb-8c2b-39bbf1e7627e','MATH-ANALYSE','Analyse mathématique','8106ef88-9716-4a10-b10b-42bc80800598','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Analyse et fonctions.', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03',true),
 ('f79f4ffd-c00b-4b9a-ae43-27c2f3330f89','MATH-ALGEBRE','Algèbre linéaire','8106ef88-9716-4a10-b10b-42bc80800598','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Algèbre linéaire et structures.', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03',true),
 ('6f0729d3-cb0a-4378-86da-64c2e8dff7d6','TIC-ALGO','Algorithmique','03ff167d-f9e8-40f1-b689-f6b65c31e05e','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Algorithmique et programmation.', '1971202a-5b4f-491e-a201-176e998c3ab4',true),
 ('ce1fdd80-7334-4828-8c02-a96c6039e7f7','TIC-WEB','Développement Web','e0a0a001-0001-4001-8001-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Développement et administration des applications web.', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03',true),
 ('c951c191-4d0e-4d1e-bc6d-893679d35395','SDD-SANTE-PUB','Santé publique','e4cea898-5363-4443-8bca-a31ebe24389c','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','Santé communautaire et santé publique.', '1971202a-5b4f-491e-a201-176e998c3ab4',true),
 ('64e58b57-33d1-46f4-85f6-efaa6cdcc5a9','SDD-ENV','Santé et environnement','e4cea898-5363-4443-8bca-a31ebe24389c','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','Environnement et santé.', '1971202a-5b4f-491e-a201-176e998c3ab4',true),
 ('e409e5c2-92e4-4b4d-a4f5-9acc6e7e106c','ECO-ECONOMETRIE','Économétrie','e72215ca-a089-432b-a2c5-ab4f78d5a900','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Techniques quantitatives appliquées à l’économie.', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03',true),
 ('7a45b0b6-0f8e-46c5-b843-00cd5ec069ea','ECO-COMPTA','Comptabilité générale','e0a0a003-0001-4001-8001-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Comptabilité et finance.', '1971202a-5b4f-491e-a201-176e998c3ab4',true),
 ('4274507c-cd27-4aa9-8738-01b68b961e97','MGT-MANAGEMENT','Management','e0a0a003-0001-4001-8001-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Management des organisations.', '1971202a-5b4f-491e-a201-176e998c3ab4',true),
 ('8088359a-6aed-4169-b1f1-151bcc43c9ec','AGRI-AGRONOMIE','Agronomie','125470b9-a651-4654-b1cb-1ea4a6021c56','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','Sciences agronomiques.', '4c18e056-1f7f-4832-a5ec-c9320982fd4f',true),
 ('cb5642fc-de19-4438-aeab-bb6884f92ec8','AGRI-ZOOTECHNIE','Zootechnie','e0a0a004-0001-4001-8001-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','Production animale et élevage.', '4c18e056-1f7f-4832-a5ec-c9320982fd4f',true),
 ('85eac65a-f8e9-4c33-829a-87f774e1652b','PHY-MECANIQUE','Mécanique','63121838-d387-4cfc-8a0d-0f65c8528abe','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Mécanique et physique.', '1971202a-5b4f-491e-a201-176e998c3ab4',true),
 ('af14f518-33ae-4076-9da4-2e59b9b4ae9e','PHY-ELECTRICITE','Électricité','63121838-d387-4cfc-8a0d-0f65c8528abe','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Électricité.', '1971202a-5b4f-491e-a201-176e998c3ab4',true),
 ('1d97ca1d-8b81-4820-b194-6218296acece','SRT-RESEAUX','Réseaux informatiques','e0a0a001-0001-4001-8001-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Réseaux et systèmes.', '1971202a-5b4f-491e-a201-176e998c3ab4',true),
 ('e0a0b001-0001-4001-8001-000000000001','MPCI-INFORMATIQUE','Informatique','e0a0a001-0001-4001-8001-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Algorithmique, programmation et informatique de base.', '11111111-1111-4111-8111-111111111111',true),
 ('e0a0b001-0001-4001-8001-000000000002','MPCI-ANGLAIS','Anglais scientifique','e0a0a001-0001-4001-8001-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Communication scientifique en anglais.', '11111111-1111-4111-8111-111111111111',true),
 ('e0a0b001-0001-4001-8001-000000000003','MPCI-CHIMIE','Chimie atomistique','e0a0a001-0001-4001-8001-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Chimie atomistique publiée dans la maquette MPCI.', '11111111-1111-4111-8111-111111111111',true),
 ('e0a0b001-0001-4001-8001-000000000004','MPCI-PHYSIQUE','Physique générale','e0a0a001-0001-4001-8001-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Électrostatique, magnétostatique, mécanique, etc.', '11111111-1111-4111-8111-111111111111',true)
ON CONFLICT (id) DO UPDATE SET code=excluded.code, nom=excluded.nom, filiere_id=excluded.filiere_id, ufr_id=excluded.ufr_id, description=excluded.description, niveau_id=excluded.niveau_id, actif=true;

-- Matières existantes : rattacher automatiquement leur UFR via la filière.
UPDATE matieres m SET ufr_id=f.ufr_id FROM filieres f WHERE f.id=m.filiere_id AND m.ufr_id IS NULL;

INSERT INTO matiere_niveaux (matiere_id,niveau_id)
SELECT m.id, m.niveau_id FROM matieres m WHERE m.niveau_id IS NOT NULL ON CONFLICT DO NOTHING;

-- Les matières sans niveau explicite sont disponibles sur les niveaux de leur filière.
INSERT INTO matiere_niveaux (matiere_id,niveau_id)
SELECT m.id, fn.niveau_id FROM matieres m JOIN filiere_niveaux fn ON fn.filiere_id=m.filiere_id
WHERE m.niveau_id IS NULL ON CONFLICT DO NOTHING;

-- Les admins ne sont jamais mentor/mentoré.
UPDATE profiles SET is_mentor=false, is_mentore=false WHERE is_admin=true;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_admin_role_exclusion;
ALTER TABLE profiles ADD CONSTRAINT profiles_admin_role_exclusion CHECK (NOT (is_admin AND (is_mentor OR is_mentore)));

-- Algorithme d'éligibilité mentor : niveau strictement supérieur à L1 (ordre >= 2).
CREATE OR REPLACE FUNCTION public.mentor_eligible(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    JOIN niveaux n ON n.id=p.niveau_id
    WHERE p.id=p_profile_id
      AND p.is_mentor=true
      AND p.is_admin=false
      AND p.statut_validation='valide'
      AND n.ordre >= 2
  );
$$;

CREATE OR REPLACE FUNCTION public.can_be_validated_as_mentor(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p JOIN niveaux n ON n.id=p.niveau_id
    WHERE p.id=p_profile_id AND p.is_mentor=true AND p.is_admin=false AND n.ordre >= 2
  );
$$;

-- Le trigger d'inscription récupère désormais aussi UFR/filière/niveau et la bio depuis les métadonnées Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, pg_temp AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, numero_carte, telephone, niveau_id, filiere_id, is_mentor, is_mentore, bio)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nom',''),'Étudiant'),
    COALESCE(NEW.raw_user_meta_data->>'prenom',''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'numero_carte',''),'carte-'||NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'telephone',''),
    NULLIF(NEW.raw_user_meta_data->>'niveau_id','')::uuid,
    NULLIF(NEW.raw_user_meta_data->>'filiere_id','')::uuid,
    COALESCE((NEW.raw_user_meta_data->>'is_mentor')::boolean,false),
    COALESCE((NEW.raw_user_meta_data->>'is_mentore')::boolean,true),
    NULLIF(NEW.raw_user_meta_data->>'bio','')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Protection serveur : un profil mentor est automatiquement en attente lors de l'inscription.
CREATE OR REPLACE FUNCTION public.guard_profile_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n_ordre int;
BEGIN
  IF NEW.is_admin THEN
    NEW.is_mentor := false;
    NEW.is_mentore := false;
    NEW.statut_validation := 'valide';
    RETURN NEW;
  END IF;
  IF NEW.is_mentor THEN
    SELECT ordre INTO n_ordre FROM niveaux WHERE id=NEW.niveau_id;
    IF COALESCE(n_ordre,0) < 2 THEN
      NEW.statut_validation := 'suspendu';
    ELSE
      IF TG_OP='INSERT' THEN NEW.statut_validation := 'en_attente'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_guard_profile_roles ON profiles;
CREATE TRIGGER trg_guard_profile_roles BEFORE INSERT OR UPDATE OF is_admin,is_mentor,is_mentore,niveau_id,statut_validation ON profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_roles();

-- Un mentor non validé ne peut pas ajouter de matières ni de disponibilités.
DROP POLICY IF EXISTS "insert_own_mentor_matieres" ON mentor_matieres;
CREATE POLICY "insert_own_mentor_matieres" ON mentor_matieres FOR INSERT TO authenticated
WITH CHECK (auth.uid()=mentor_id AND public.mentor_eligible(mentor_id));
DROP POLICY IF EXISTS "update_own_mentor_matieres" ON mentor_matieres;
CREATE POLICY "update_own_mentor_matieres" ON mentor_matieres FOR UPDATE TO authenticated
USING (auth.uid()=mentor_id AND public.mentor_eligible(mentor_id))
WITH CHECK (auth.uid()=mentor_id AND public.mentor_eligible(mentor_id));
DROP POLICY IF EXISTS "delete_own_mentor_matieres" ON mentor_matieres;
CREATE POLICY "delete_own_mentor_matieres" ON mentor_matieres FOR DELETE TO authenticated
USING (auth.uid()=mentor_id AND public.mentor_eligible(mentor_id));

DROP POLICY IF EXISTS "insert_own_disponibilites" ON disponibilites;
CREATE POLICY "insert_own_disponibilites" ON disponibilites FOR INSERT TO authenticated
WITH CHECK (auth.uid()=mentor_id AND public.mentor_eligible(mentor_id));
DROP POLICY IF EXISTS "update_own_disponibilites" ON disponibilites;
CREATE POLICY "update_own_disponibilites" ON disponibilites FOR UPDATE TO authenticated
USING (auth.uid()=mentor_id AND public.mentor_eligible(mentor_id))
WITH CHECK (auth.uid()=mentor_id AND public.mentor_eligible(mentor_id));
DROP POLICY IF EXISTS "delete_own_disponibilites" ON disponibilites;
CREATE POLICY "delete_own_disponibilites" ON disponibilites FOR DELETE TO authenticated
USING (auth.uid()=mentor_id AND public.mentor_eligible(mentor_id));

-- Les sessions ne peuvent viser qu'un mentor validé et éligible.
DROP POLICY IF EXISTS "insert_sessions" ON sessions;
CREATE POLICY "insert_sessions" ON sessions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid()=mentore_id
  AND EXISTS (SELECT 1 FROM profiles p WHERE p.id=mentore_id AND p.is_admin=false)
  AND public.mentor_eligible(mentor_id)
);

-- Vue pratique pour l'interface de recherche.
CREATE OR REPLACE VIEW public.v_mentor_search AS
SELECT p.id, p.nom, p.prenom, p.niveau_id, p.filiere_id, p.photo_url, p.bio,
       f.nom AS filiere_nom, f.ufr_id, u.code AS ufr_code, u.nom AS ufr_nom,
       n.code AS niveau_code, n.nom AS niveau_nom, n.ordre AS niveau_ordre
FROM profiles p
JOIN filieres f ON f.id=p.filiere_id
JOIN ufrs u ON u.id=f.ufr_id
JOIN niveaux n ON n.id=p.niveau_id
WHERE p.is_mentor=true AND p.is_admin=false AND p.statut_validation='valide' AND n.ordre>=2;

GRANT SELECT ON public.ufrs, public.filieres, public.niveaux, public.matieres, public.filiere_niveaux, public.matiere_niveaux, public.v_mentor_search TO anon, authenticated;
