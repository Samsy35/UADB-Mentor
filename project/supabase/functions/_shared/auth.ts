/**
 * JWT verification for Edge Functions.
 * Validates the Supabase JWT from the Authorization header and returns the user id.
 */
import { createClient } from "npm:@supabase/supabase-js@2.111.0";

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Token d'authentification manquant" };
  }
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return { ok: false, status: 401, error: "Token d'authentification invalide" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return { ok: false, status: 401, error: "Token expiré ou invalide" };
  }

  return { ok: true, userId: data.user.id };
}
