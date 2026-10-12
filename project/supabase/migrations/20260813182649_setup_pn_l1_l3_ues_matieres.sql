-- === Semestres S1-S2 (L1) et S5-S6 (L3) pour SATIC-PN — pas de L2 ===
INSERT INTO semestres (niveau_id, filiere_id, code, numero, nom, actif) VALUES
('11111111-1111-4111-8111-111111111111','e0a0a001-0001-4001-8001-000000000005','S1',1,'Semestre 1',true),
('11111111-1111-4111-8111-111111111111','e0a0a001-0001-4001-8001-000000000005','S2',2,'Semestre 2',true),
('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','e0a0a001-0001-4001-8001-000000000005','S5',5,'Semestre 5',true),
('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','e0a0a001-0001-4001-8001-000000000005','S6',6,'Semestre 6',true);

-- === UEs ===
INSERT INTO ues (semestre_id, code, nom, credits, actif)
SELECT s.id, v.code, v.nom, v.credits, true
FROM (VALUES
 ('S1','MPCI111','Informatique I',4),
 ('S1','MPCI112','Communication I',2),
 ('S1','MPCI113','Chimie I',8),
 ('S1','MPCI114','Physique I',8),
 ('S1','MPCI115','Mathématiques I',8),
 ('S2','MPCI121','Informatique II',4),
 ('S2','MPCI122','Communication II',2),
 ('S2','MPCI123','Chimie II',8),
 ('S2','MPCI124','Physique II',8),
 ('S2','MPCI125','Mathématiques II',8),
 ('S5','PN351','Math-Info',7),
 ('S5','PC352','Physique A',15),
 ('S5','PN353','Physique B',8),
 ('S6','PN361','Math-Info',7),
 ('S6','PC362','Physique A',15),
 ('S6','PN363','Physique B',5),
 ('S6','PN364','Projet tutoré',3)
) AS v(sem_code, code, nom, credits)
JOIN semestres s ON s.code = v.sem_code AND s.filiere_id = 'e0a0a001-0001-4001-8001-000000000005';

-- === Matières (éléments constitutifs) ===
INSERT INTO matieres (code, nom, filiere_id, niveau_id, semestre_id, ue_id, coefficient, cm, td, tp, tpe, vht, actif)
SELECT v.code, v.nom, 'e0a0a001-0001-4001-8001-000000000005', s.niveau_id, s.id, u.id, v.coef, v.cm, v.td, v.tp, v.tpe, v.vht, true
FROM (VALUES
 ('S1','MPCI111','MPCI1111','Algorithmique et Programmation I (Lang C)',1,24,24,0,32,80),
 ('S1','MPCI112','MPCI1121','Anglais I',1,24,0,0,16,40),
 ('S1','MPCI113','MPCI1131','Chimie physique I',1,24,24,0,32,80),
 ('S1','MPCI113','MPCI1132','Chimie physique II',1,24,24,0,32,80),
 ('S1','MPCI114','MPCI1141','Electricité I',1,24,24,0,32,80),
 ('S1','MPCI114','MPCI1142','Mécanique',1,24,24,0,32,80),
 ('S1','MPCI115','MPCI1151','Algèbre I',1,24,24,0,32,80),
 ('S1','MPCI115','MPCI1152','Analyse I',1,24,24,0,32,80),
 ('S2','MPCI121','MPCI1211','Algorithmique et Programmation II (Lang C)',1,24,24,0,32,80),
 ('S2','MPCI122','MPCI1221','Anglais II',1,24,0,0,16,40),
 ('S2','MPCI123','MPCI1231','Chimie physique I',1,18,18,12,32,80),
 ('S2','MPCI123','MPCI1232','Chimie physique II',1,18,18,12,32,80),
 ('S2','MPCI124','MPCI1241','Electricité II',1,18,18,12,32,80),
 ('S2','MPCI124','MPCI1242','Optique',1,18,18,12,32,80),
 ('S2','MPCI125','MPCI1251','Algèbre II',1,24,24,0,32,80),
 ('S2','MPCI125','MPCI1252','Analyse II',1,24,24,0,32,80),
 ('S5','PN351','PN3511','Analyse numérique',1,20,24,12,16,72),
 ('S5','PN351','PN3512','Programmation avancée',1,20,18,12,18,68),
 ('S5','PC352','PC3521','Mécanique des fluides',1,24,24,12,40,100),
 ('S5','PC352','PC3522','Ondes et vibrations',1,24,24,12,40,100),
 ('S5','PC352','PC3523','Electronique analogique',1,24,24,12,40,100),
 ('S5','PN353','PN3531','Laser et applications',1,20,0,24,36,80),
 ('S5','PN353','PN3532','Physique nucléaire et radiations',1,20,0,24,36,80),
 ('S6','PN361','PN3611','Initiation à l''optimisation',1,24,18,6,14,62),
 ('S6','PN361','PN3612','Introduction à l''Internet des objets',1,20,12,12,34,78),
 ('S6','PC362','PC3621','Electromagnétisme dans la matière',1,24,24,12,40,100),
 ('S6','PC362','PC3622','Optique ondulatoire',1,24,24,12,40,100),
 ('S6','PC362','PC3623','Electronique numérique',1,24,24,12,40,100),
 ('S6','PN363','PN3631','Mécanique quantique avancée',1,20,0,12,18,50),
 ('S6','PN363','PN3632','Traitement du signal',0.5,10,0,10,5,25),
 ('S6','PN363','PN3633','Introduction à l''automatique',0.5,10,0,10,5,25),
 ('S6','PN364','PN3641','Projet tutoré',1,0,0,12,48,60)
) AS v(sem_code, ue_code, code, nom, coef, cm, td, tp, tpe, vht)
JOIN semestres s ON s.code = v.sem_code AND s.filiere_id = 'e0a0a001-0001-4001-8001-000000000005'
JOIN ues u ON u.code = v.ue_code AND u.semestre_id = s.id;;
