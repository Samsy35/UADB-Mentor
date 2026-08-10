/*
# Fix automatic profile creation during signup

1. Purpose
- Correct the database trigger that creates a profile when a student creates an account.
- Use an explicit schema and search path so the trigger works reliably when called by Supabase Auth.

2. Modified objects
- `public.handle_new_user()` — replaces the trigger function implementation without changing user data or table structure.
- `auth.users` trigger `on_auth_user_created` — recreated to use the corrected function.

3. Security
- Keeps the function `SECURITY DEFINER` so Supabase Auth can create the linked profile during registration.
- Restricts the function search path to trusted schemas and writes only to `public.profiles`.

4. Data safety
- No tables, columns, or existing rows are deleted or changed.
- The function remains idempotent for the trigger definition.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nom,
    prenom,
    numero_carte,
    telephone,
    is_mentor,
    is_mentore
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nom', ''), 'Étudiant'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'numero_carte', ''), 'carte-' || NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'telephone', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_mentor')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'is_mentore')::boolean, true)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();