
-- ECOMIJ-MJEF (Management Juridique Environnemental et Foncier) — L1 à L6.
-- L1/L2 : tronc commun IJ (variante JA). L3 : maquette officielle ANAQ-Sup (rapport d'accréditation, fiable).

insert into filiere_niveaux (filiere_id, niveau_id) values
  ('e0a0a003-0001-4001-8001-000000000006', '11111111-1111-4111-8111-111111111111'),
  ('e0a0a003-0001-4001-8001-000000000006', '1971202a-5b4f-491e-a201-176e998c3ab4'),
  ('e0a0a003-0001-4001-8001-000000000006', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03')
on conflict do nothing;

insert into semestres (id, filiere_id, niveau_id, code, numero, nom) values
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000006', '11111111-1111-4111-8111-111111111111', 'S1', 1, 'Semestre 1'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000006', '11111111-1111-4111-8111-111111111111', 'S2', 2, 'Semestre 2'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000006', '1971202a-5b4f-491e-a201-176e998c3ab4', 'S3', 3, 'Semestre 3'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000006', '1971202a-5b4f-491e-a201-176e998c3ab4', 'S4', 4, 'Semestre 4'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000006', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S5', 5, 'Semestre 5'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000006', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S6', 6, 'Semestre 6');

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
  ('S5','IJMFE351','Droit et Economie de l''environnement',6),
  ('S5','IJMFE352','Droit et Gestion foncière',12),
  ('S5','IJMFE353','Gouvernance et droit des collectivités locales',8),
  ('S5','IJMFE354','Outils de base',4),
  ('S6','IJMFE361','Urbanisme et construction',8),
  ('S6','IJMF362','Banque et assurance',6),
  ('S6','IJMFE363','Gestion financière des collectivités locales',3),
  ('S6','IJMFE364','Informatique et Langues',4),
  ('S6','IJMFE365','Stage professionnel',9)
) as v(sem_code, code, nom, credits) on v.sem_code = s.code
where s.filiere_id = 'e0a0a003-0001-4001-8001-000000000006';

insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, cm, td, tp, vht, coefficient)
select gen_random_uuid(), v.nom, 'e0a0a003-0001-4001-8001-000000000006', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
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
join semestres s on s.filiere_id = 'e0a0a003-0001-4001-8001-000000000006' and s.code = v.sem_code
join ues u on u.semestre_id = s.id and u.code = v.ue_code;

-- L3 MJEF (source ANAQ-Sup, fiable)
insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, cm, td, tp, vht, coefficient, source)
select gen_random_uuid(), v.nom, 'e0a0a003-0001-4001-8001-000000000006', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       s.niveau_id, s.id, u.id, v.code, v.cm, v.td, v.tp, v.vht, v.coef, 'Rapport ANAQ-Sup accréditation (mars 2025)'
from (values
('S5','IJMFE351','IJMFE3511','Droit de l''environnement',24,12,24,60,2),
('S5','IJMFE351','IJMFE3512','Géographie de l''environnement',24,0,16,40,1),
('S5','IJMFE351','IJMFE3513','Economie de l''environnement',24,0,16,40,1),
('S5','IJMFE352','IJMFE3521','Droit international public (TC)',36,0,14,60,1),
('S5','IJMFE352','IJMFE3522','Droit de la fonction publique (TC)',36,12,14,60,1),
('S5','IJMFE352','IJMFE3523','Droit foncier approfondi',36,24,40,100,2),
('S5','IJMFE353','IJMFE3531','Droit de la fonction publique locale',30,0,50,80,2),
('S5','IJMFE353','IJMFE3532','Droit des collectivités locales',30,0,50,80,2),
('S5','IJMFE354','IJMFE3541','Informatique',12,0,8,20,1),
('S5','IJMFE354','IJMFE3542','Anglais technique',12,0,8,20,1),
('S5','IJMFE354','IJMFE3543','Méthodologie',24,0,16,40,2),
('S6','IJMFE361','IJMFE3611','Droit de l''urbanisme',36,24,40,100,2),
('S6','IJMFE361','IJMFE3612','Droit de la construction',24,12,24,60,1),
('S6','IJMF362','IJMFE3621','Aménagement du territoire',24,0,16,40,1),
('S6','IJMF362','IJMFE3622','Techniques de passation Marchés (TC)',24,12,24,60,1),
('S6','IJMF362','IJMFE3623','Droit des assurances/construction et à l''environnement',24,12,24,60,1),
('S6','IJMFE363','IJMFE3631','Fiscalité locale',12,0,8,20,1),
('S6','IJMFE363','IJMFE3632','Fiscalité immobilière et droits d''enregistrement',12,0,8,20,1),
('S6','IJMFE363','IJMFE3633','Finances publiques locales',12,0,8,20,1),
('S6','IJMFE364','IJMFE3641','Informatique',12,0,8,20,1),
('S6','IJMFE364','IJMFE3642','Anglais',12,0,8,20,1),
('S6','IJMFE364','IJMFE3643','Techniques administratives et développement personnel',24,0,16,40,2),
('S6','IJMFE365','IJMFE3651','Rapport de stage / mémoire',0,0,180,180,2)
) as v(sem_code, ue_code, code, nom, cm, td, tp, vht, coef)
join semestres s on s.filiere_id = 'e0a0a003-0001-4001-8001-000000000006' and s.code = v.sem_code
join ues u on u.semestre_id = s.id and u.code = v.ue_code;
;
