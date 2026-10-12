
-- ECOMIJ-MRO (Management Responsable des Organisations) — L1 à L6.
-- Source fiche officielle lisible et propre (FICHE-LMRO-ok.pdf). Contenu propre (pas de tronc IJ).
-- L3 : tronc commun S5/S6 + 2 options S5 (OBNL, Collectivités Territoriales) comme UE supplémentaires.
-- Electifs transversaux (Sénégal/Afrique/Monde) inclus comme UE électives, rattachées à S2/S4/S6.

-- 0. Nettoyage du reliquat orphelin
delete from matieres where id = '4274507c-cd27-4aa9-8738-01b68b961e97';

insert into filiere_niveaux (filiere_id, niveau_id) values
  ('e0a0a003-0001-4001-8001-000000000002', '11111111-1111-4111-8111-111111111111'),
  ('e0a0a003-0001-4001-8001-000000000002', '1971202a-5b4f-491e-a201-176e998c3ab4'),
  ('e0a0a003-0001-4001-8001-000000000002', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03')
on conflict do nothing;

insert into semestres (id, filiere_id, niveau_id, code, numero, nom) values
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000002', '11111111-1111-4111-8111-111111111111', 'S1', 1, 'Semestre 1'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000002', '11111111-1111-4111-8111-111111111111', 'S2', 2, 'Semestre 2'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000002', '1971202a-5b4f-491e-a201-176e998c3ab4', 'S3', 3, 'Semestre 3'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000002', '1971202a-5b4f-491e-a201-176e998c3ab4', 'S4', 4, 'Semestre 4'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000002', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S5', 5, 'Semestre 5'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000002', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S6', 6, 'Semestre 6');

insert into ues (id, semestre_id, code, nom, credits)
select gen_random_uuid(), s.id, v.code, v.nom, v.credits
from semestres s
join (values
  ('S1','MRO111','Economie et Management',8),
  ('S1','MRO112','Outils de gestion',10),
  ('S1','MRO113','Environnement juridique et social',6),
  ('S1','MRO114','Monde professionnel',6),
  ('S2','MRO121','Economie et Management',9),
  ('S2','MRO122','Outils de gestion',9),
  ('S2','MRO123','Environnement juridique et social',6),
  ('S2','MRO124','Monde professionnel',6),
  ('S2','ELEC-L1','Enseignements libres L1 (Ouverture sur le Sénégal)',11),
  ('S3','MRO231','Gestion responsable',9),
  ('S3','MRO232','Environnement Economique et fiscal',9),
  ('S3','MRO233','Environnement juridique',6),
  ('S3','MRO234','Monde professionnel',6),
  ('S4','MRO241','Outils de gestion opérationnels',12),
  ('S4','MRO242','Système d''information',8),
  ('S4','MRO243','Ethique et Leadership',5),
  ('S4','MRO244','Monde professionnel',5),
  ('S4','ELEC-L2','Enseignements libres L2 (Ouverture sur l''Afrique)',11),
  ('S5','MRO351','Gestion axée sur les résultats (Tronc commun)',9),
  ('S5','MRO352','Gestion Planification et gestion des données (Tronc commun)',9),
  ('S5','MOBNL353','[Option OBNL] Gouvernance et administration',7),
  ('S5','MOBNL354','[Option OBNL] Economie publique et responsabilité',5),
  ('S5','MCT353','[Option Collectivités Territoriales] Administration et Finance publique',6),
  ('S5','MCT354','[Option Collectivités Territoriales] Economie publique et responsabilité',6),
  ('S6','MRO361','Monde professionnel / Stage (Tronc commun)',30),
  ('S6','ELEC-L3','Enseignements libres L3 (Ouverture sur le Monde)',11)
) as v(sem_code, code, nom, credits) on v.sem_code = s.code
where s.filiere_id = 'e0a0a003-0001-4001-8001-000000000002';

insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, cm, td, tp, vht, coefficient)
select gen_random_uuid(), v.nom, 'e0a0a003-0001-4001-8001-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       s.niveau_id, s.id, u.id, v.code, v.cm, v.td, v.tp, v.vht, v.coef
from (values
-- S1
('S1','MRO111','MRO1111','Les fondamentaux de la Comptabilité générale',30,18,32,80,4),
('S1','MRO111','MRO1112','Principes de l''économie',30,18,32,80,4),
('S1','MRO112','MRO1121','Algèbre linéaire',24,18,28,70,3.5),
('S1','MRO112','MRO1122','Statistiques descriptives',24,18,28,70,3.5),
('S1','MRO112','MRO1123','Bureautique : Excel, Word',18,18,24,60,3),
('S1','MRO113','MRO1131','Introduction au droit',24,0,16,40,2),
('S1','MRO113','MRO1132','Organisation administrative',24,0,16,40,2),
('S1','MRO113','MRO1133','Introduction à la sociologie',24,0,16,40,2),
('S1','MRO114','MRO1141','Anglais des affaires',24,0,16,40,2),
('S1','MRO114','MRO1142','Techniques d''expression',18,0,12,30,1.5),
('S1','MRO114','MRO1143','Projet professionnel personnalisé (Découverte des métiers)',18,12,20,50,2.5),
-- S2
('S2','MRO121','MRO1211','Comptabilité des opérations courantes',24,18,28,70,3.5),
('S2','MRO121','MRO1212','Economie Générale',24,18,28,70,3.5),
('S2','MRO121','MRO1213','Fondamentaux du Management',24,0,16,40,2),
('S2','MRO122','MRO1221','Mathématiques financières',18,18,24,60,3),
('S2','MRO122','MRO1222','Probabilités',18,18,24,60,3),
('S2','MRO122','MRO1223','Bureautique 2 (PowerPoint, Excel)',18,18,24,60,3),
('S2','MRO123','MRO1231','Introduction au droit administratif',24,0,16,40,2),
('S2','MRO123','MRO1232','Droit des affaires',24,0,16,40,2),
('S2','MRO123','MRO1233','Sociologie des organisations',24,0,16,40,2),
('S2','MRO124','MRO1241','Anglais des affaires 2',24,0,16,40,2),
('S2','MRO124','MRO1242','Techniques de communication',18,0,12,30,1.5),
('S2','MRO124','MRO1243','Projet professionnel personnalisé (Immersion et Employabilité)',18,12,20,50,2.5),
-- S3
('S3','MRO231','MRO2311','Comptabilité de gestion',24,18,28,70,3.5),
('S3','MRO231','MRO2312','Comportement organisationnel',18,12,24,54,2.5),
('S3','MRO231','MRO2313','Gestion administrative du personnel',24,12,20,56,3),
('S3','MRO232','MRO2321','Economie de l''entreprise',24,12,24,60,3),
('S3','MRO232','MRO2322','Introduction à la fiscalité',24,12,24,60,3),
('S3','MRO232','MRO2323','Economie monétaire et financière',24,12,24,60,3),
('S3','MRO233','MRO2331','Droit des contrats et des obligations',18,6,16,40,2),
('S3','MRO233','MRO2332','Droit de la famille',18,6,16,40,2),
('S3','MRO233','MRO2333','Droit du travail',18,6,16,40,2),
('S3','MRO234','MRO2341','Anglais des affaires',18,0,12,30,1.5),
('S3','MRO234','MRO2342','Rédaction administrative',24,0,16,40,2),
('S3','MRO234','MRO2343','Projet professionnel personnalisé (Finalisation projet)',12,18,20,50,2.5),
-- S4
('S4','MRO241','MRO2411','Diagnostic financier',24,12,24,60,3),
('S4','MRO241','MRO2412','Outils de gestion budgétaire',24,12,24,60,3),
('S4','MRO241','MRO2413','Marketing',24,12,24,60,3),
('S4','MRO241','MRO2414','Logistique & transport',24,12,24,60,3),
('S4','MRO242','MRO2421','Gestion des systèmes d''information',18,12,20,50,2.5),
('S4','MRO242','MRO2422','Logiciel intégré de gestion',18,18,24,60,3),
('S4','MRO242','MRO2423','SGBD, webmastering & réseaux sociaux',12,18,20,50,2.5),
('S4','MRO243','MRO2431','Leadership, gestion des conflits et changement',18,0,12,30,1.5),
('S4','MRO243','MRO2432','Ethique & Déontologie des affaires',18,0,12,30,1.5),
('S4','MRO243','MRO2433','Communication et relation publique',18,6,16,40,2),
('S4','MRO244','MRO2441','Techniques de recherche d''emploi',18,0,12,30,1.5),
('S4','MRO244','MRO2442','Projet professionnel personnalisé (Création d''entreprise)',24,18,28,70,3.5),
-- S5 tronc commun
('S5','MRO351','MRO3511','Management de projet',24,12,24,60,3),
('S5','MRO351','MRO3512','Gestion de la qualité',24,12,24,60,3),
('S5','MRO351','MRO3513','Planification stratégique et opérationnelle',24,12,24,60,3),
('S5','MRO352','MRO3521','Planification financière',24,12,24,60,3),
('S5','MRO352','MRO3522','Analyse et traitement des données',24,12,24,60,3),
('S5','MRO352','MRO3523','TDB et Reporting',24,12,24,60,3),
-- S5 Option OBNL
('S5','MOBNL353','MOBNL3531','Citoyenneté & Bonne Gouvernance',18,12,20,50,2.5),
('S5','MOBNL353','MOBNL3532','Economie sociale et solidaire',18,12,20,50,2.5),
('S5','MOBNL353','MOBNL3533','Fiscalité des OBNL',24,0,16,40,2),
('S5','MOBNL354','MOBNL3541','Lobbying et plaidoyer',24,12,24,60,3),
('S5','MOBNL354','MOBNL3542','Responsabilité sociétale des organisations',24,0,16,40,2),
-- S5 Option MCT
('S5','MCT353','MCT3531','Finances et comptabilité publiques',24,0,16,40,2),
('S5','MCT353','MCT3532','Management public',24,0,16,40,2),
('S5','MCT353','MCT3533','Fiscalité locale',24,0,16,40,2),
('S5','MCT354','MCT3541','Droit public économique',24,0,16,40,2),
('S5','MCT354','MCT3542','Marchés publics',24,0,16,40,2),
('S5','MCT354','MCT3543','Responsabilité sociétale des collectivités territoriales',24,0,16,40,2),
-- S6 tronc commun
('S6','MRO361','MRO3611','Ateliers de rédaction de rapport de stage',24,0,16,40,2),
('S6','MRO361','MRO3612','Atelier appels d''offre et rédaction de TDR',24,0,16,40,2),
('S6','MRO361','MRO3613','Rapport de stage ou projet tutoré',0,0,520,520,26),
-- Electifs L1 (attaché S2)
('S2','ELEC-L1','ELECL1-SPORT','Sport',12,8,0,20,1),
('S2','ELEC-L1','ELECL1-ECO-SN','Situation Economique du Sénégal',18,12,20,50,2.5),
('S2','ELEC-L1','ELECL1-HIST-SN','Histoire politique du Sénégal',18,12,20,50,2.5),
('S2','ELEC-L1','ELECL1-LITT-SN','Littérature sénégalaise',18,12,20,50,2.5),
('S2','ELEC-L1','ELECL1-SOC-SN','Société sénégalaise',18,12,20,50,2.5),
-- Electifs L2 (attaché S4)
('S4','ELEC-L2','ELECL2-SPORT','Sport',12,8,0,20,1),
('S4','ELEC-L2','ELECL2-ECO-AFR','Situation économique de l''Afrique',18,12,20,50,2.5),
('S4','ELEC-L2','ELECL2-HIST-GEN-AFR','Histoire générale de l''Afrique',18,12,20,50,2.5),
('S4','ELEC-L2','ELECL2-HIST-POL-AFR','Histoire politique de l''Afrique',18,12,20,50,2.5),
('S4','ELEC-L2','ELECL2-LITT-AFR','Littérature africaine',18,12,20,50,2.5),
-- Electifs L3 (attaché S6)
('S6','ELEC-L3','ELECL3-SPORT','Sport',12,8,0,20,1),
('S6','ELEC-L3','ELECL3-ECO-MONDE','Grands problèmes économiques contemporains',18,12,20,50,2.5),
('S6','ELEC-L3','ELECL3-GEOPOL','Géopolitique mondiale',18,12,20,50,2.5),
('S6','ELEC-L3','ELECL3-PENSEURS','Grands penseurs contemporains',18,12,20,50,2.5),
('S6','ELEC-L3','ELECL3-PHILO','Philosophie',18,12,20,50,2.5)
) as v(sem_code, ue_code, code, nom, cm, td, tp, vht, coef)
join semestres s on s.filiere_id = 'e0a0a003-0001-4001-8001-000000000002' and s.code = v.sem_code
join ues u on u.semestre_id = s.id and u.code = v.ue_code;
;
