-- Supprime les 2 matières placeholder L3 non conformes au référentiel officiel
DELETE FROM matieres WHERE code IN ('MATH-ANALYSE','MATH-ALGEBRE');

-- === UEs Semestre 5 ===
INSERT INTO ues (semestre_id, code, nom, credits, actif) VALUES
('dbc378db-9711-4dc7-a93e-716ffd7ca43c','MA351','Topologie et Analyse hilbertienne',8,true),
('dbc378db-9711-4dc7-a93e-716ffd7ca43c','MA352','Mesure et Intégration',8,true),
('dbc378db-9711-4dc7-a93e-716ffd7ca43c','MA353','Logique et Algèbre',8,true),
('dbc378db-9711-4dc7-a93e-716ffd7ca43c','MA354','Informatique V',6,true);

-- === UEs Semestre 6 ===
INSERT INTO ues (semestre_id, code, nom, credits, actif) VALUES
('fe379467-d293-4fce-83e6-8fdfa4e3ae37','MA361','Calcul Différentiel',9,true),
('fe379467-d293-4fce-83e6-8fdfa4e3ae37','MA362','Analyse Complexe',6,true),
('fe379467-d293-4fce-83e6-8fdfa4e3ae37','MA363','Probabilités et Statistique',9,true),
('fe379467-d293-4fce-83e6-8fdfa4e3ae37','MA364','Courbes, Surfaces et Sous-Variétés',6,true);

-- === Matières (éléments constitutifs) S5 ===
INSERT INTO matieres (code, nom, filiere_id, niveau_id, semestre_id, ue_id, coefficient, cm, td, tp, tpe, vht, actif)
SELECT v.code, v.nom, '8106ef88-9716-4a10-b10b-42bc80800598', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03',
       'dbc378db-9711-4dc7-a93e-716ffd7ca43c', u.id, v.coef, v.cm, v.td, v.tp, v.tpe, v.vht, true
FROM (VALUES
  ('MA3511','Topologie générale','MA351',3,36,36,0,48,120),
  ('MA3512','Analyse hilbertienne','MA351',1,12,12,0,16,40),
  ('MA3521','Théorie de la mesure','MA352',1,24,24,0,32,80),
  ('MA3522','Théorie de l''intégration','MA352',1,24,24,0,32,80),
  ('MA3531','Logique','MA353',1,12,12,0,16,40),
  ('MA3532','Structures algébriques de base','MA353',3,36,36,0,48,120),
  ('MA3541','Systèmes d''information et Base de données','MA354',2,18,18,12,32,80),
  ('MA3542','Python','MA354',1,12,12,0,16,40)
) AS v(code, nom, ue_code, coef, cm, td, tp, tpe, vht)
JOIN ues u ON u.code = v.ue_code AND u.semestre_id = 'dbc378db-9711-4dc7-a93e-716ffd7ca43c';

-- === Matières (éléments constitutifs) S6 ===
INSERT INTO matieres (code, nom, filiere_id, niveau_id, semestre_id, ue_id, coefficient, cm, td, tp, tpe, vht, actif)
SELECT v.code, v.nom, '8106ef88-9716-4a10-b10b-42bc80800598', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03',
       'fe379467-d293-4fce-83e6-8fdfa4e3ae37', u.id, v.coef, v.cm, v.td, v.tp, v.tpe, v.vht, true
FROM (VALUES
  ('MA3611','Calcul différentiel sur les espaces de Banach','MA361',5,30,30,0,40,100),
  ('MA3612','Equations Différentielles Ordinaires','MA361',4,24,24,0,32,80),
  ('MA3621','Fonctions analytiques et holomorphes d''une variable complexe','MA362',1,18,18,0,24,60),
  ('MA3622','Théorie de Cauchy et Applications','MA362',1,18,18,0,24,60),
  ('MA3631','Probabilités','MA363',4,24,24,0,32,80),
  ('MA3632','Statistique','MA363',5,30,30,0,40,100),
  ('MA3641','Géométrie des courbes et surfaces','MA364',2,24,24,0,32,80),
  ('MA3642','Sous-variétés de Rn','MA364',1,12,12,0,16,40)
) AS v(code, nom, ue_code, coef, cm, td, tp, tpe, vht)
JOIN ues u ON u.code = v.ue_code AND u.semestre_id = 'fe379467-d293-4fce-83e6-8fdfa4e3ae37';;
