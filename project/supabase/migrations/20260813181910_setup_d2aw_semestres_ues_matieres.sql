-- Supprime les 5 matières placeholder non conformes
DELETE FROM matieres WHERE code IN ('MPCI-ANGLAIS','MPCI-CHIMIE','MPCI-INFORMATIQUE','MPCI-PHYSIQUE','TIC-WEB');

-- === Semestres S1-S6 pour SATIC-D2AW ===
INSERT INTO semestres (niveau_id, filiere_id, code, numero, nom, actif) VALUES
('11111111-1111-4111-8111-111111111111','e0a0a001-0001-4001-8001-000000000003','S1',1,'Semestre 1',true),
('11111111-1111-4111-8111-111111111111','e0a0a001-0001-4001-8001-000000000003','S2',2,'Semestre 2',true),
('1971202a-5b4f-491e-a201-176e998c3ab4','e0a0a001-0001-4001-8001-000000000003','S3',3,'Semestre 3',true),
('1971202a-5b4f-491e-a201-176e998c3ab4','e0a0a001-0001-4001-8001-000000000003','S4',4,'Semestre 4',true),
('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','e0a0a001-0001-4001-8001-000000000003','S5',5,'Semestre 5',true),
('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','e0a0a001-0001-4001-8001-000000000003','S6',6,'Semestre 6',true);

-- === UEs (S1-S6) ===
INSERT INTO ues (semestre_id, code, nom, credits, actif)
SELECT s.id, v.code, v.nom, v.credits, true
FROM (VALUES
 ('S1','WEB111','Architecture et Système d''exploitation',10),
 ('S1','WEB112','Mathématiques',8),
 ('S1','WEB113','Techniques d''expression et initiation à l''Informatique',4),
 ('S1','WEB114','Algorithmique',8),
 ('S2','WEB121','Algorithmique et programmation',14),
 ('S2','WEB122','Probabilité, statistique et comptabilité',6),
 ('S2','WEB123','Réseaux',6),
 ('S2','WEB124','Humanité I',4),
 ('S3','WEB231','Réseaux et Linux',10),
 ('S3','WEB232','Conception des systèmes d''information',6),
 ('S3','WEB233','Langage C',10),
 ('S3','WEB234','Humanité II',4),
 ('S4','WEB241','Programmation Web dynamique / orientée objet',13),
 ('S4','WEB242','Bases de données relationnelles',6),
 ('S4','WEB243','Administration système',8),
 ('S5','WEB351','POO avancée',12),
 ('S5','WEB352','PHP, JSP et Servlet',10),
 ('S5','WEB353','Administration de base de données et technologies XML',8),
 ('S6','WEB361','CMS et Multimédia',7),
 ('S6','WEB362','Management et communication',9),
 ('S6','WEB363','Stage',14)
) AS v(sem_code, code, nom, credits)
JOIN semestres s ON s.code = v.sem_code AND s.filiere_id = 'e0a0a001-0001-4001-8001-000000000003';

-- === Matières (éléments constitutifs) S1-S6 ===
INSERT INTO matieres (code, nom, filiere_id, niveau_id, semestre_id, ue_id, coefficient, cm, td, tp, tpe, vht, actif)
SELECT v.code, v.nom, 'e0a0a001-0001-4001-8001-000000000003', s.niveau_id, s.id, u.id, v.coef, v.cm, v.td, v.tp, v.tpe, v.vht, true
FROM (VALUES
 ('S1','WEB111','WEB1111','Architecture et technologie des ordinateurs',1,24,24,0,32,80),
 ('S1','WEB111','WEB1112','Système d''exploitation',1,24,24,24,48,120),
 ('S1','WEB112','WEB1121','Algèbre',1,24,24,0,32,80),
 ('S1','WEB112','WEB1122','Analyse',1,24,24,0,32,80),
 ('S1','WEB113','WEB1131','Techniques d''expression',1,12,12,0,16,40),
 ('S1','WEB113','WEB1132','Initiation à l''Informatique',1,0,0,24,16,40),
 ('S1','WEB114','WEB1141','Introduction à l''algorithmique et à la programmation',1,36,36,24,64,160),
 ('S2','WEB121','WEB1211','HTML et CSS',1,24,0,48,48,120),
 ('S2','WEB121','WEB1212','Approfondissement à l''algorithmique et à la programmation',1,36,36,24,64,160),
 ('S2','WEB122','WEB1221','Probabilité et statistique',1,24,24,0,32,80),
 ('S2','WEB122','WEB1222','Comptabilité générale',1,12,12,0,16,40),
 ('S2','WEB123','WEB1231','Introduction sur les réseaux',1,24,24,24,48,120),
 ('S2','WEB124','WEB1241','Projet Personnel et Professionnel (PPP)',1,12,12,0,16,40),
 ('S2','WEB124','WEB1242','Anglais',1,24,0,0,16,40),
 ('S3','WEB231','WEB2311','Linux utilisateur',1,12,0,24,24,60),
 ('S3','WEB231','WEB2312','Réseaux',1,24,24,24,48,120),
 ('S3','WEB232','WEB2321','Conception des systèmes d''information avec Merise',1,24,24,24,48,120),
 ('S3','WEB233','WEB2331','Langage C',1,24,24,24,48,120),
 ('S3','WEB233','WEB2332','Javascript',1,24,0,24,32,80),
 ('S3','WEB234','WEB2341','Technique de communication',1,12,12,0,16,40),
 ('S3','WEB234','WEB2342','Anglais technique',1,12,0,12,8,20),
 ('S4','WEB241','WEB2411','PHP',1,24,0,48,48,120),
 ('S4','WEB241','WEB2412','POO avec Java',1,24,24,24,48,120),
 ('S4','WEB242','WEB2421','Bases de données relationnelles',1,24,24,24,48,120),
 ('S4','WEB243','WEB2431','Administration Linux',1,24,0,24,32,80),
 ('S4','WEB243','WEB2432','Administration Windows',1,24,0,24,32,80),
 ('S5','WEB351','WEB3511','Modélisation orientée objet avec UML',1,24,24,24,48,120),
 ('S5','WEB351','WEB3512','Java avancé',1,24,24,24,48,120),
 ('S5','WEB352','WEB3521','Frameworks Web',1,0,0,48,32,80),
 ('S5','WEB352','WEB3522','JSP et Servlet',1,24,24,24,48,120),
 ('S5','WEB353','WEB3531','Administration de base de données Oracle',1,24,0,24,32,80),
 ('S5','WEB353','WEB3532','Technologies XML',1,12,24,12,32,80),
 ('S6','WEB361','WEB3611','Multimédia',1,0,0,48,32,80),
 ('S6','WEB361','WEB3612','CMS',1,0,0,36,24,60),
 ('S6','WEB362','WEB3621','Méthodologie de rédaction de mémoire',1,12,0,12,16,40),
 ('S6','WEB362','WEB3622','Anglais (Communication)',1,12,12,0,16,40),
 ('S6','WEB362','WEB3623','Droit des TIC',1,24,0,0,16,40),
 ('S6','WEB362','WEB3624','Gestion de projet',1,12,0,12,16,40),
 ('S6','WEB363','WEB3631','Stage',1,0,0,0,300,300)
) AS v(sem_code, ue_code, code, nom, coef, cm, td, tp, tpe, vht)
JOIN semestres s ON s.code = v.sem_code AND s.filiere_id = 'e0a0a001-0001-4001-8001-000000000003'
JOIN ues u ON u.code = v.ue_code AND u.semestre_id = s.id;;
