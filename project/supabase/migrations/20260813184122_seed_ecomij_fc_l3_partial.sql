
-- Finance Comptabilité (ECOMIJ-FC) : filière de spécialisation L3 uniquement (comme SATIC-PN)
-- Contenu S5/S6 PARTIEL : seules 2 matières confirmées via recherche web (fiche PDF officielle illisible - scan).
-- À compléter ultérieurement avec la maquette officielle complète.

-- 1. Rattachement filière <-> niveau L3
insert into filiere_niveaux (filiere_id, niveau_id)
values ('e0a0a003-0001-4001-8001-000000000001', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03')
on conflict do nothing;

-- 2. Semestres S5 et S6
insert into semestres (id, filiere_id, niveau_id, code, numero, nom)
values
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000001', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S5', 5, 'Semestre 5'),
  (gen_random_uuid(), 'e0a0a003-0001-4001-8001-000000000001', '1649ecb8-1110-4ef4-9a6c-40bee1b41c03', 'S6', 6, 'Semestre 6');

-- 3. UE provisoires (une par semestre, credits/coeff inconnus -> NULL) + matière trouvée
insert into ues (id, semestre_id, code, nom, credits, description)
select gen_random_uuid(), s.id, 'FC351', 'UE provisoire S5 (à compléter)', null,
       'UE de rattachement temporaire - maquette officielle non disponible (scan illisible)'
from semestres s where s.filiere_id = 'e0a0a003-0001-4001-8001-000000000001' and s.code = 'S5';

insert into ues (id, semestre_id, code, nom, credits, description)
select gen_random_uuid(), s.id, 'FC361', 'UE provisoire S6 (à compléter)', null,
       'UE de rattachement temporaire - maquette officielle non disponible (scan illisible)'
from semestres s where s.filiere_id = 'e0a0a003-0001-4001-8001-000000000001' and s.code = 'S6';

-- 4. Les 2 matières confirmées
insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, source)
select gen_random_uuid(), 'Marketing fondamental',
       'e0a0a003-0001-4001-8001-000000000001',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       '1649ecb8-1110-4ef4-9a6c-40bee1b41c03',
       s.id, u.id, 'FC3511',
       'ifoad.uadb.edu.sn (partiel - semestre à vérifier)'
from semestres s
join ues u on u.semestre_id = s.id and u.code = 'FC351'
where s.filiere_id = 'e0a0a003-0001-4001-8001-000000000001' and s.code = 'S5';

insert into matieres (id, nom, filiere_id, ufr_id, niveau_id, semestre_id, ue_id, code, source)
select gen_random_uuid(), 'Investissement-Financement',
       'e0a0a003-0001-4001-8001-000000000001',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       '1649ecb8-1110-4ef4-9a6c-40bee1b41c03',
       s.id, u.id, 'FC3611',
       'foad.uadb.edu.sn (partiel - semestre à vérifier)'
from semestres s
join ues u on u.semestre_id = s.id and u.code = 'FC361'
where s.filiere_id = 'e0a0a003-0001-4001-8001-000000000001' and s.code = 'S6';
;
