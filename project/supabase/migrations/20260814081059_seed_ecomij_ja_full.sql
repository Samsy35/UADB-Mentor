
-- ECOMIJ-JA (Juriste d'Affaires) — L1 à L6 complet, source fiche officielle lisible.

-- 1. Rattachements filière <-> niveaux
insert into filiere_niveaux (filiere_id, niveau_id) values
  ('e0a0a003-0001-4001-8001-000000000004', '11111111-1111-4111-8111-111111111111'),
  ('e0a0a003-0001-4001-8001-000000000004', '1971202a-5b4f-491e-a201-176e998c3ab4'),
  ('e0a0a003-0001-4001-8001-000000000004', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03')
on conflict do nothing;

-- 2. Semestres S1 à S6
insert into semestres (id, filiere_id, niveau_id, code, numero, nom) values
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000004', '11111111-1111-4111-8111-111111111111', 'S1', 1, 'Semestre 1'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000004', '11111111-1111-4111-8111-111111111111', 'S2', 2, 'Semestre 2'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000004', '1971202a-5b4f-491e-a201-176e998c3ab4', 'S3', 3, 'Semestre 3'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000004', '1971202a-5b4f-491e-a201-176e998c3ab4', 'S4', 4, 'Semestre 4'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000004', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S5', 5, 'Semestre 5'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000004', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S6', 6, 'Semestre 6');

-- 3. UEs (S1-S4 tronc commun IJ + S5/S6 spécifiques JA)
insert into ues (id, semestre_id, code, nom, credits)
select gen_random_uuid(), s.id, v.code, v.nom, v.credits
from semestres s
join (values
  ('S1','IJ111','Droit public',10),
  ('S1','IJ112','Droit privé',8),
  ('S1','IJ113','Economie et management',6),
  ('S1','IJ114','Monde professionnel',6),
  ('S2','IJ121','Droit public',10),
  ('S2','IJ122','Droit privé',8),
  ('S2','IJ123','Techniques quantitatives et de gestion',6),
  ('S2','IJ124','Monde professionnel',6),
  ('S3','IJ231','Droit public',10),
  ('S3','IJ232','Droit privé',10),
  ('S3','IJ233','Economie et Gestion',4),
  ('S3','IJ234','Monde professionnel',6),
  ('S4','IJ241','Droit public',10),
  ('S4','IJ212','Droit privé',10),
  ('S4','IJ213','Gestion',6),
  ('S4','IJ214','Monde professionnel',4),
  ('S5','I2JEA351','Droit de l''entreprise 1',7),
  ('S5','I2JEA352','Environnement de l''Entreprise 1',6),
  ('S5','I2JEA353','Droit du Contentieux',4),
  ('S5','I2JEA354','Techniques juridiques',5),
  ('S5','I2JEA355','Entreprise et chiffres',4),
  ('S5','I2JEA356','Outils de base',4),
  ('S6','I2JA361','Droit de l''entreprise 2',6),
  ('S6','I2JA362','Environnement de l''Entreprise 2',4),
  ('S6','I2JEA363','Gestion des risques et financement de l''entreprise',4),
  ('S6','I2JEA364','Droit et marchés',5),
  ('S6','I2JEA365','Créations immatérielles',3),
  ('S6','I2JEA366','Stage professionnel',8)
) as v(sem_code, code, nom, credits) on v.sem_code = s.code
where s.filiere_id = 'e0a0a003-0001-4001-8001-000000000004';

-- 4. Matières S1-S4 (tronc commun IJ)
insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, cm, td, tp, vht, coefficient)
select gen_random_uuid(), v.nom, 'e0a0a003-0001-4001-8001-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       s.niveau_id, s.id, u.id, v.code, v.cm, v.td, v.tp, v.vht, v.coef
from (values
('S1','IJ111','IJ1111','Droit Constitutionnel',36,24,0,80,2),
('S1','IJ111','IJ1112','Histoire du Droit',36,24,0,80,2),
('S1','IJ111','IJ1113','Institution Internationale',24,16,0,40,1),
('S1','IJ112','IJ1121','Droit Civil',36,24,0,100,2),
('S1','IJ112','IJ1122','Institutions Judiciaires',36,24,0,60,1),
('S1','IJ113','IJ1131','Comptabilité Générale',24,12,0,60,1),
('S1','IJ113','IJ1132','Economie Politique',24,12,0,60,1),
('S1','IJ114','IJ1141','TEC',24,16,0,40,1),
('S1','IJ114','IJ1142','Anglais juridique',24,16,0,40,1),
('S1','IJ114','IJ1143','Informatique',24,16,0,40,1),
('S2','IJ121','IJ1211','Droit Constitutionnel',36,24,0,80,2),
('S2','IJ121','IJ1212','Introduction à la science politique',36,12,0,80,2),
('S2','IJ121','IJ1213','Système politique sénégalais',24,16,0,40,1),
('S2','IJ122','IJ1221','Droit Civil',36,24,0,100,2),
('S2','IJ122','IJ1222','Droit des Biens',24,12,0,60,1),
('S2','IJ123','IJ1231','Comptabilité Générale',24,12,0,60,1),
('S2','IJ123','IJ1232','Statistique',24,12,0,60,1),
('S2','IJ124','IJ1241','PPP',24,16,0,40,1),
('S2','IJ124','IJ1242','Anglais juridique',24,16,0,40,1),
('S2','IJ124','IJ1243','Informatique',24,16,0,40,1),
('S3','IJ231','IJ2311','Droit Administratif',36,24,0,80,2),
('S3','IJ231','IJ2312','Finances publiques',36,24,0,80,2),
('S3','IJ231','IJ2313','Relations internationales et géopolitique',24,16,0,40,1),
('S3','IJ232','IJ2321','Droit des obligations',36,24,0,80,2),
('S3','IJ232','IJ2322','Droit Pénal Général',36,24,0,80,2),
('S3','IJ232','IJ2323','Droit communautaire',24,16,0,40,1),
('S3','IJ233','IJ2331','Comptabilité Générale',24,16,0,40,1),
('S3','IJ233','IJ2332','Economie Politique',24,16,0,40,1),
('S3','IJ234','IJ2341','TEC',24,16,0,40,1),
('S3','IJ234','IJ2342','Anglais juridique',24,16,0,40,1),
('S3','IJ234','IJ2343','Informatique',24,16,0,40,1),
('S4','IJ241','IJ2411','Droit Administratif',36,24,0,80,2),
('S4','IJ241','IJ2412','Finances publiques',36,24,0,80,2),
('S4','IJ241','IJ2413','Droit des libertés fondamentales',24,16,0,40,1),
('S4','IJ212','IJ2121','Droit des obligations',36,24,0,80,2),
('S4','IJ212','IJ2122','Droit Pénal Général',36,24,0,80,2),
('S4','IJ212','IJ2123','Droit du travail',24,16,0,40,1),
('S4','IJ213','IJ2131','Comptabilité des sociétés',24,12,0,60,1),
('S4','IJ213','IJ2132','Analyse financière',24,12,0,60,1),
('S4','IJ214','IJ2141','TEC',24,16,0,40,1),
('S4','IJ214','IJ2142','Anglais juridique',12,8,0,20,1),
('S4','IJ214','IJ2143','Informatique',12,8,0,20,1)
) as v(sem_code, ue_code, code, nom, cm, td, tp, vht, coef)
join semestres s on s.filiere_id = 'e0a0a003-0001-4001-8001-000000000004' and s.code = v.sem_code
join ues u on u.semestre_id = s.id and u.code = v.ue_code;

-- 5. Matières S5-S6 (spécifiques JA)
insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, cm, td, tp, vht, coefficient)
select gen_random_uuid(), v.nom, 'e0a0a003-0001-4001-8001-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       s.niveau_id, s.id, u.id, v.code, v.cm, v.td, v.tp, v.vht, v.coef
from (values
('S5','I2JEA351','I2JEA3511','Droit commercial général',32,16,32,80,2),
('S5','I2JEA351','I2JEA3512','Relations collectives de travail',24,12,24,60,1),
('S5','I2JEA352','I2JEA3521','Contrats spéciaux',12,6,12,30,1),
('S5','I2JEA352','I2JEA3522','Droit du financement de l''entreprise 1',20,10,20,50,1),
('S5','I2JEA352','I2JEA3523','Droit des sûretés',18,6,16,40,1),
('S5','I2JEA353','I2JEA3531','Procédure civile en cours',22,8,20,50,2),
('S5','I2JEA353','I2JEA3532','Voies d''exécution',12,6,12,30,1),
('S5','I2JEA354','I2JEA3541','Rédaction d''actes',24,12,24,60,1),
('S5','I2JEA354','I2JEA3542','Régimes matrimoniaux et libéralités',16,8,16,40,1),
('S5','I2JEA355','I2JEA3551','Fiscalité de l''entreprise',16,8,16,40,2),
('S5','I2JEA355','I2JEA3552','Droit comptable',16,8,16,40,2),
('S5','I2JEA356','I2JEA3561','Méthodologie de recherche',6,6,8,20,1),
('S5','I2JEA356','I2JEA3562','Anglais juridique',6,6,8,20,1),
('S5','I2JEA356','I2JEA3563','Informatique',12,null,8,20,1),
('S6','I2JA361','I2JA3611','Droit des groupements d''affaires',30,18,32,80,2),
('S6','I2JA361','I2JA3612','Droit social en chiffres',18,6,16,40,1),
('S6','I2JA362','I2JA3621','Droit international privé',24,0,16,40,2),
('S6','I2JA362','I2JEA3622','Droit maritime',24,0,16,40,1),
('S6','I2JEA363','I2JEA3631','Droit du financement de l''entreprise 2',12,6,12,30,1),
('S6','I2JEA363','I2JEA3632','Droit des assurances',12,6,12,30,1),
('S6','I2JEA363','I2JEA3633','Droit pénal des affaires',12,6,12,30,1),
('S6','I2JEA364','I2JEA3641','Droit de la concurrence',12,6,12,30,1),
('S6','I2JEA364','I2JEA3642','Techniques de passation de Marchés publics',18,6,16,40,1),
('S6','I2JEA364','I2JEA3643','Droit des marchés financiers',12,6,12,30,1),
('S6','I2JEA365','I2JEA3651','Droit de la propriété intellectuelle',12,6,12,30,1),
('S6','I2JEA365','I2JEA3652','Droit des TIC',12,6,12,30,1),
('S6','I2JEA366','I2JEA3661','Rapport de stage / mémoire',null,null,null,160,null)
) as v(sem_code, ue_code, code, nom, cm, td, tp, vht, coef)
join semestres s on s.filiere_id = 'e0a0a003-0001-4001-8001-000000000004' and s.code = v.sem_code
join ues u on u.semestre_id = s.id and u.code = v.ue_code;
;
