/*
# Fix seed accounts — ajouter les entrées manquantes dans auth.identities

## Problème
La migration 20260809125641 insère les utilisateurs directement dans auth.users
via crypt()/gen_salt('bf'), mais n'insère pas les lignes correspondantes dans
auth.identities. Depuis les versions récentes de Supabase GoTrue, une entrée
dans auth.identities est OBLIGATOIRE pour que signInWithPassword fonctionne.
Sans elle, l'authentification renvoie "Invalid login credentials".

## Solution
Pour chaque compte créé par le seed (admin + 6 mentors) :
1. Vérifie si l'identité email est absente
2. L'insère si manquante (idempotent — ON CONFLICT DO NOTHING)

Cette migration ne modifie aucune donnée existante, ne supprime rien,
et peut être réappliquée sans risque.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction helper : insère l'identité email si absente pour un utilisateur donné
CREATE OR REPLACE FUNCTION _fix_auth_identity(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = auth, public, extensions AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Récupère l'id de l'utilisateur dans auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Utilisateur introuvable : %', p_email;
    RETURN;
  END IF;

  -- Insère l'identité email si elle n'existe pas déjà
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id::text, p_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- S'assure aussi que email_confirmed_at est défini (requis pour la connexion)
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmation_token  = COALESCE(NULLIF(confirmation_token, ''), ''),
    recovery_token      = COALESCE(NULLIF(recovery_token, ''), ''),
    email_change_token_new = COALESCE(NULLIF(email_change_token_new, ''), ''),
    email_change        = COALESCE(NULLIF(email_change, ''), ''),
    raw_app_meta_data   = COALESCE(
      raw_app_meta_data,
      '{"provider":"email","providers":["email"]}'::jsonb
    )
  WHERE id = v_user_id;

END;
$$;

-- Appliquer le correctif sur tous les comptes du seed
DO $$
BEGIN
  PERFORM _fix_auth_identity('admin@uadb.edu.sn');
  PERFORM _fix_auth_identity('awa.diop@uadb.edu.sn');
  PERFORM _fix_auth_identity('mamadou.sarr@uadb.edu.sn');
  PERFORM _fix_auth_identity('fatou.ndiaye@uadb.edu.sn');
  PERFORM _fix_auth_identity('cheikh.fall@uadb.edu.sn');
  PERFORM _fix_auth_identity('aminata.ba@uadb.edu.sn');
  PERFORM _fix_auth_identity('ousmane.diallo@uadb.edu.sn');
END $$;

-- Nettoyage
DROP FUNCTION IF EXISTS _fix_auth_identity(text);
