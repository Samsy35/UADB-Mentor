-- Supprime toute matière placeholder existante pour SRT
DELETE FROM matieres WHERE filiere_id = 'e0a0a001-0001-4001-8001-000000000002';

-- === Semestres S1-S6 ===
INSERT INTO semestres (niveau_id, filiere_id, code, numero, nom, actif) VALUES
('11111111-1111-4111-8111-111111111111','e0a0a001-0001-4001-8001-000000000002','S1',1,'Semestre 1',true),
('11111111-1111-4111-8111-111111111111','e0a0a001-0001-4001-8001-000000000002','S2',2,'Semestre 2',true),
('1971202a-5b4f-491e-a201-176e998c3ab4','e0a0a001-0001-4001-8001-000000000002','S3',3,'Semestre 3',true),
('1971202a-5b4f-491e-a201-176e998c3ab4','e0a0a001-0001-4001-8001-000000000002','S4',4,'Semestre 4',true),
('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','e0a0a001-0001-4001-8001-000000000002','S5',5,'Semestre 5',true),
('1649ecb8-1110-4ef4-9a6c-40bee1b41c03','e0a0a001-0001-4001-8001-000000000002','S6',6,'Semestre 6',true);

-- === UEs ===
INSERT INTO ues (semestre_id, code, nom, credits, actif)
SELECT s.id, v.code, v.nom, v.credits, true
FROM (VALUES
 ('S1','SRT111','Architecture et Systèmes d''exploitation',10),
 ('S1','SRT112','Mathématiques I',8),
 ('S1','SRT113','Humanités et Initiation en Informatique',4),
 ('S1','SRT114','Initiation à l''Algorithmique et à la Programmation',8),
 ('S2','SRT121','Réseaux et Structure de données',11),
 ('S2','SRT122','Mathématiques II',12),
 ('S2','SRT123','Electricité et Traitement du signal',7),
 ('S3','SRT231','Algorithmique et Programmation II',6),
 ('S3','SRT232','Electronique et RO',8),
 ('S3','SRT233','Réseaux et Systèmes',10),
 ('S3','SRT234','Humanité',6),
 ('S4','SRT241','Programmation et Base de données',14),
 ('S4','SRT242','Télécommunications et Maintenance des ordinateurs',8),
 ('S4','SRT243','Administration Système',8),
 ('S5','SRT351','Réseaux informatiques',8),
 ('S5','SRT352','Sécurité des systèmes',7),
 ('S5','SRT353','Programmation avancée',15),
 ('S6','SRT361','Management et Communication',9),
 ('S6','SRT362','Stage',21)
) AS v(sem_code, code, nom, credits)
JOIN semestres s ON s.code = v.sem_code AND s.filiere_id = 'e0a0a001-0001-4001-8001-000000000002';

-- === Matières (éléments constitutifs) ===
INSERT INTO matieres (code, nom, filiere_id, niveau_id, semestre_id, ue_id, coefficient, cm, td, tp, tpe, vht, actif)
SELECT v.code, v.nom, 'e0a0a001-0001-4001-8001-000000000002', s.niveau_id, s.id, u.id, v.coef, v.cm, v.td, v.tp, v.tpe, v.vht, true
FROM (VALUES
 ('S1','SRT111','SRT1111','Architecture et Technologie des ordinateurs',1,24,24,0,32,80),
 ('S1','SRT111','SRT1112','Système d''exploitation',1,24,24,24,48,120),
 ('S1','SRT112','SRT1121','Algèbre I',1,24,24,0,32,80),
 ('S1','SRT112','SRT1122','Analyse I',1,24,24,0,32,80),
 ('S1','SRT113','SRT1131','Technique d''expression',1,12,12,0,16,40),
 ('S1','SRT113','SRT1132','Anglais',1,12,0,0,8,20),
 ('S1','SRT113','SRT1133','Initiation en Informatique',1,0,0,12,8,20),
 ('S1','SRT114','SRT1141','Initiation à Algorithmique',1,24,36,0,40,100),
 ('S1','SRT114','SRT1142','Initiation à la Programmation',1,12,0,24,24,60),
 ('S2','SRT121','SRT1211','Introduction aux Réseaux',2,24,24,12,40,100),
 ('S2','SRT121','SRT1212','Structure de données',1,36,24,12,48,120),
 ('S2','SRT122','SRT1221','Algèbre II',1,24,24,0,32,80),
 ('S2','SRT122','SRT1222','Analyse II',1,24,24,0,32,80),
 ('S2','SRT122','SRT1223','Statistique et Probabilité',1,24,12,12,32,80),
 ('S2','SRT123','SRT1231','Electricité',1,24,12,12,32,80),
 ('S2','SRT123','SRT1232','Traitement du signal',1,24,0,12,24,60),
 ('S3','SRT231','SRT2311','Algorithmique II',1,12,12,0,16,40),
 ('S3','SRT231','SRT2312','Programmation II',1,12,0,36,32,80),
 ('S3','SRT232','SRT2321','Electronique',1,24,12,12,32,80),
 ('S3','SRT232','SRT2322','Recherche Opérationnelle',1,24,24,0,32,80),
 ('S3','SRT233','SRT2331','Services Réseau',1,16,8,24,32,80),
 ('S3','SRT233','SRT2332','Réseaux sans fil',1,8,0,16,16,40),
 ('S3','SRT233','SRT2333','Linux',1,24,24,0,32,80),
 ('S3','SRT234','SRT2341','Technique de communication',1,12,12,0,16,40),
 ('S3','SRT234','SRT2342','Anglais Technique',1,24,0,0,16,40),
 ('S3','SRT234','SRT2343','Projet Professionnel Personnel',1,24,0,0,16,40),
 ('S4','SRT241','SRT2411','Java',1,24,24,24,48,120),
 ('S4','SRT241','SRT2412','SIBD',1,24,12,12,32,80),
 ('S4','SRT241','SRT2413','Programmation WEB (HTML/PHP)',1,24,0,24,32,80),
 ('S4','SRT242','SRT2421','Bases des Télécoms',1,12,12,12,24,60),
 ('S4','SRT242','SRT2422','Réseaux de mobiles',1,12,12,0,16,40),
 ('S4','SRT242','SRT2423','Maintenance des ordinateurs',1,12,0,24,24,60),
 ('S4','SRT243','SRT2431','Administration Linux',1,24,0,24,32,80),
 ('S4','SRT243','SRT2432','Administration Windows',1,24,0,24,32,80),
 ('S5','SRT351','SRT3511','Routage',1,24,12,24,40,100),
 ('S5','SRT351','SRT3512','Réseaux étendus',1,12,0,24,24,60),
 ('S5','SRT352','SRT3521','Sécurité',1,24,12,12,32,80),
 ('S5','SRT352','SRT3522','Maintenance des périphériques',1,12,0,24,24,60),
 ('S5','SRT353','SRT3531','Java avancé',1,24,12,36,48,120),
 ('S5','SRT353','SRT3532','Web Services',1,12,12,36,40,100),
 ('S5','SRT353','SRT3533','Développement mobile',1,12,0,36,32,80),
 ('S6','SRT361','SRT3611','Méthodologie',1,12,12,0,16,40),
 ('S6','SRT361','SRT3612','Droit des TIC',1,24,0,0,16,40),
 ('S6','SRT361','SRT3613','Gestion de Projet',2,24,0,12,24,60),
 ('S6','SRT361','SRT3614','Anglais (Communication)',1,24,0,0,16,40),
 ('S6','SRT362','SRT3621','Stage',1,0,0,0,100,100),
 ('S6','SRT362','SRT3622','Rédaction',1,0,0,0,100,100),
 ('S6','SRT362','SRT3623','Soutenance',1,0,0,0,220,220)
) AS v(sem_code, ue_code, code, nom, coef, cm, td, tp, tpe, vht)
JOIN semestres s ON s.code = v.sem_code AND s.filiere_id = 'e0a0a001-0001-4001-8001-000000000002'
JOIN ues u ON u.code = v.ue_code AND u.semestre_id = s.id;;
