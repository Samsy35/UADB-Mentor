
-- ECOMIJ-AP (Administration Publique) — L1 à L6 complet, source fiche officielle lisible et propre à AP.

insert into filiere_niveaux (filiere_id, niveau_id) values
  ('e0a0a003-0001-4001-8001-000000000003', '11111111-1111-4111-8111-111111111111'),
  ('e0a0a003-0001-4001-8001-000000000003', '1971202a-5b4f-491e-a201-176e998c3ab4'),
  ('e0a0a003-0001-4001-8001-000000000003', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03')
on conflict do nothing;

insert into semestres (id, filiere_id, niveau_id, code, numero, nom) values
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000003', '11111111-1111-4111-8111-111111111111', 'S1', 1, 'Semestre 1'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000003', '11111111-1111-4111-8111-111111111111', 'S2', 2, 'Semestre 2'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000003', '1971202a-5b4f-491e-a201-176e998c3ab4', 'S3', 3, 'Semestre 3'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000003', '1971202a-5b4f-491e-a201-176e998c3ab4', 'S4', 4, 'Semestre 4'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000003', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S5', 5, 'Semestre 5'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000003', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S6', 6, 'Semestre 6');

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
  ('S5','IJAP351','Droit public',12),
  ('S5','IJAP352','Droit public relationnel',8),
  ('S5','IJAP353','Droit et économie',6),
  ('S5','IJAP354','Outils de base',4),
  ('S6','IJAP361','Droit public 2',12),
  ('S6','IJAP362','Gestion publique',6),
  ('S6','IJAP363','Organisation Administrative',4),
  ('S6','IJAP364','Stage professionnel',8)
) as v(sem_code, code, nom, credits) on v.sem_code = s.code
where s.filiere_id = 'e0a0a003-0001-4001-8001-000000000003';

insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, cm, td, tp, vht, coefficient)
select gen_random_uuid(), v.nom, 'e0a0a003-0001-4001-8001-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
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
('S3','IJ232','IJ2323','Gestion foncière',24,16,0,40,1),
('S3','IJ233','IJ2331','Comptabilité Générale',24,16,0,40,1),
('S3','IJ233','IJ2332','Economie Politique',24,16,0,40,1),
('S3','IJ234','IJ2341','TEC',24,16,0,40,1),
('S3','IJ234','IJ2342','Anglais juridique',24,16,0,40,1),
('S3','IJ234','IJ2343','Informatique',24,16,0,40,1),
('S4','IJ241','IJ2411','Droit Administratif',36,24,0,80,2),
('S4','IJ241','IJ2412','Finances publiques',36,24,0,80,2),
('S4','IJ241','IJ2413','Droit communautaire',24,16,0,40,1),
('S4','IJ212','IJ2121','Droit des obligations',36,24,0,80,2),
('S4','IJ212','IJ2122','Droit Pénal Général',36,24,0,80,2),
('S4','IJ212','IJ2123','Droit du travail',24,16,0,40,1),
('S4','IJ213','IJ2131','Comptabilité des sociétés',24,12,0,60,1),
('S4','IJ213','IJ2132','Analyse financière',24,12,0,60,1),
('S4','IJ214','IJ2141','TEC',24,16,0,40,1),
('S4','IJ214','IJ2142','Anglais juridique',12,8,0,20,1),
('S4','IJ214','IJ2143','Informatique',12,8,0,20,1)
) as v(sem_code, ue_code, code, nom, cm, td, tp, vht, coef)
join semestres s on s.filiere_id = 'e0a0a003-0001-4001-8001-000000000003' and s.code = v.sem_code
join ues u on u.semestre_id = s.id and u.code = v.ue_code;

insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, cm, td, tp, vht, coefficient)
select gen_random_uuid(), v.nom, 'e0a0a003-0001-4001-8001-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       s.niveau_id, s.id, u.id, v.code, v.cm, v.td, v.tp, v.vht, v.coef
from (values
('S5','IJAP351','IJAP3511','Droit international public (1ère partie)',36,24,0,100,2),
('S5','IJAP351','IJAP3512','Droit de la fonction publique',36,24,0,100,2),
('S5','IJAP351','IJCEC3513','Fiscalité tronc commun',16,8,16,40,1),
('S5','IJAP352','IJAP3521','Relations collectives de travail et sécurité sociale tronc commun',20,10,20,50,1),
('S5','IJAP352','IJAP3522','Droit électoral',24,12,24,60,1),
('S5','IJAP352','IJAP3523','Systèmes politiques africains',20,10,20,50,1),
('S5','IJAP353','IJAP3531','Typologie des contrats publics',14,10,16,40,1),
('S5','IJAP353','IJAP3532','Relations économiques internationales',14,10,16,40,1),
('S5','IJAP353','IJAP3533','Droit commercial',14,10,16,40,1),
('S5','IJAP354','IJAP3541','Méthodologie de rédaction tronc commun',18,6,16,40,2),
('S5','IJAP354','IJAP3542','Anglais juridique tronc commun',8,4,8,20,1),
('S5','IJAP354','IJAP3543','Informatique tronc commun',8,4,8,20,1),
('S6','IJAP361','IJAP3611','Droit international public 2',36,24,0,100,2),
('S6','IJAP361','IJAP3612','Droit administratif des biens',36,24,0,100,2),
('S6','IJAP361','IJAP3613','Contentieux administratif',16,8,16,40,1),
('S6','IJAP362','IJAP3621','Gouvernance des institutions publiques',14,10,16,40,1),
('S6','IJAP362','IJAP3622','Droit de la Régulation',14,10,16,40,1),
('S6','IJAP362','IJAP3623','Techniques de Passation des marchés publics',14,10,16,40,1),
('S6','IJAP363','IJAP3631','Droit des collectivités locales',12,8,12,32,1),
('S6','IJAP363','IJAP3632','Institutions administratives',8,6,10,24,1),
('S6','IJAP363','IJAP3633','Aménagement du territoire',8,6,10,24,1),
('S6','IJAP364','IJAP3641','Rapport de stage / mémoire',null,null,null,160,2)
) as v(sem_code, ue_code, code, nom, cm, td, tp, vht, coef)
join semestres s on s.filiere_id = 'e0a0a003-0001-4001-8001-000000000003' and s.code = v.sem_code
join ues u on u.semestre_id = s.id and u.code = v.ue_code;
;
