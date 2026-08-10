/*
# Auto-create profile on signup

When a new user registers via Supabase Auth, automatically create a `profiles` row
linked to that user. This uses raw_user_meta_data passed at signUp time to pre-fill
nom, prenom, etc. The frontend will pass these metadata fields during registration.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, nom, prenom, numero_carte, telephone, is_mentor, is_mentore)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Étudiant'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'numero_carte', ''),
    COALESCE(NEW.raw_user_meta_data->>'telephone', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_mentor')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'is_mentore')::boolean, true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();