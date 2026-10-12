-- === Semestres S1-S6 pour SATIC-CA ===
INSERT INTO semestres (niveau_id, filiere_id, code, numero, nom, actif) VALUES
('11111111-1111-4111-8111-111111111111','e0a0a001-0001-4001-8001-000000000001','S1',1,'Semestre 1',true),
('11111111-1111-4111-8111-111111111111','e0a0a001-0001-4001-8001-000000000001','S2',2,'Semestre 2',true),
('1971202a-5b4f-491e-a201-176e998c3ab4','e0a0a001-0001-4001-8001-000000000001','S3',3,'Semestre 3',true),
('1971202a-5b4f-491e-a201-176e998c3ab4','e0a0a001-0001-4001-8001-000000000001','S4',4,'Semestre 4',true),
('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','e0a0a001-0001-4001-8001-000000000001','S5',5,'Semestre 5',true),
('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','e0a0a001-0001-4001-8001-000000000001','S6',6,'Semestre 6',true);

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
 ('S3','MPCI231','Informatique III',4),
 ('S3','MPCI232','Communication III',2),
 ('S3','PC233','Chimie III',9),
 ('S3','MPCI234','Physique III',9),
 ('S3','PC235','Mathématiques III',6),
 ('S4','MPCI241','Informatique IV',4),
 ('S4','MPCI242','Communication IV',2),
 ('S4','PC243','Chimie IV',9),
 ('S4','MPCI244','Physique IV',9),
 ('S4','PC245','Mathématiques IV',6),
 ('S5','CHIM351','Chimie organique et inorganique',8),
 ('S5','CHIM352','Chimie biologique',8),
 ('S5','CHIM353','Chimie Physique',10),
 ('S5','CHIM354','Sécurité et Communication',4),
 ('S6','CHIM361','Chimie des procédés et Traitements des eaux',12),
 ('S6','CHIM362','Professionnalisation',18)
) AS v(sem_code, code, nom, credits)
JOIN semestres s ON s.code = v.sem_code AND s.filiere_id = 'e0a0a001-0001-4001-8001-000000000001';

-- === Matières (éléments constitutifs) ===
INSERT INTO matieres (code, nom, filiere_id, niveau_id, semestre_id, ue_id, coefficient, cm, td, tp, tpe, vht, actif)
SELECT v.code, v.nom, 'e0a0a001-0001-4001-8001-000000000001', s.niveau_id, s.id, u.id, v.coef, v.cm, v.td, v.tp, v.tpe, v.vht, true
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
 ('S3','MPCI231','MPCI2311','Algorithmique et Programmation III (Langage C)',1,24,24,0,32,80),
 ('S3','MPCI232','MPCI2321','Anglais Scientifique III',1,24,0,0,16,40),
 ('S3','PC233','PC2331','Liaisons chimiques et réactivité en solution aqueuse',1,18,18,12,32,80),
 ('S3','PC233','PC2332','Chimie organique descriptive',1,18,18,0,24,60),
 ('S3','PC233','PC2333','Cinétique Chimique',1,12,12,0,16,40),
 ('S3','MPCI234','MPCI2341','Mécanique quantique',1,24,24,6,36,90),
 ('S3','MPCI234','MPCI2342','Thermodynamique physique',1,24,24,6,36,90),
 ('S3','PC235','PC2351','Intégrales et Séries',2,24,24,0,32,80),
 ('S3','PC235','PC2352','Algèbre linéaire',1,12,12,0,16,40),
 ('S4','MPCI241','MPCI2411','Programmation orientée objet (Python)',1,12,0,36,32,80),
 ('S4','MPCI242','MPCI2421','Anglais Scientifique IV',1,24,0,0,16,40),
 ('S4','PC243','PC2431','Chimie organique dynamique',1,18,18,12,32,80),
 ('S4','PC243','PC2432','Biochimie Structurale',1,15,15,0,20,50),
 ('S4','PC243','PC2433','Chimie des solides',1,15,15,0,20,50),
 ('S4','MPCI244','MPCI2441','Electromagnétisme dans le vide et Relativité Restreinte',1,24,24,6,36,90),
 ('S4','MPCI244','MPCI2442','Mécanique du solide',1,24,24,6,36,90),
 ('S4','PC245','PC2453','Calcul différentiel et intégral sur Rn',1,18,18,0,24,60),
 ('S4','PC245','PC2454','Probabilités et statistique',1,18,18,0,24,60),
 ('S5','CHIM351','CHIM3511','Méthode de Synthèse Organique',1,20,20,8,32,80),
 ('S5','CHIM351','CHIM3512','Chimie Inorganique',1,20,20,8,32,80),
 ('S5','CHIM352','CHIM3521','Polymères Organiques et Inorganiques',1,20,20,8,32,80),
 ('S5','CHIM352','CHIM3522','Biochimie et biomolécule',1,20,20,8,32,80),
 ('S5','CHIM353','CHIM3531','Thermodynamique chimique et Electrochimie',1,20,20,8,32,72),
 ('S5','CHIM353','CHIM3532','Chimie Analytique et Spectroscopie',1,20,20,0,24,64),
 ('S5','CHIM353','CHIM3533','Chimie quantique',1,20,20,0,24,64),
 ('S5','CHIM354','CHIM3541','Contrôle qualité des produits et Sécurité chimique',1,18,0,12,18,48),
 ('S5','CHIM354','CHIM3542','Techniques d''expression',1,20,0,0,12,32),
 ('S6','CHIM361','CHIM3611','Chimie industrielle',1,24,24,0,32,80),
 ('S6','CHIM361','CHIM3612','Traitements des eaux',1,24,24,0,32,80),
 ('S6','CHIM361','CHIM3613','Introduction au raffinage et à la pétrochimie',1,24,24,0,32,80),
 ('S6','CHIM362','CHIM3621','Immersion en entreprise',1,0,0,0,240,240),
 ('S6','CHIM362','CHIM3622','Rapport de stage',1,0,0,0,120,120)
) AS v(sem_code, ue_code, code, nom, coef, cm, td, tp, tpe, vht)
JOIN semestres s ON s.code = v.sem_code AND s.filiere_id = 'e0a0a001-0001-4001-8001-000000000001'
JOIN ues u ON u.code = v.ue_code AND u.semestre_id = s.id;;
