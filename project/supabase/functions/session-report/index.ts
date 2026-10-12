/**
 * Session Report Edge Function — MentorUADB
 *
 * Permet au mentor et à l'étudiant de renseigner le suivi post-séance.
 * - Mentor : peut créer/modifier le rapport complet (toutes les colonnes)
 * - Étudiant : peut uniquement renseigner son niveau de compréhension
 *
 * POST /functions/v1/session-report
 * Body (mentor) : {
 *   session_id: string (UUID),
 *   sujet_traite?: string,
 *   notions_abordees?: string,
 *   difficultes_observees?: string,
 *   exercices_realises?: string,
 *   niveau_comprehension_mentor?: 'insuffisant'|'en_progres'|'acquis'|'excellent',
 *   recommandations?: string,
 *   objectif_prochaine_seance?: string
 * }
 * Body (étudiant) : {
 *   session_id: string (UUID),
 *   niveau_comprehension_etudiant: 'incompris'|'partiellement'|'bien_compris'|'tres_bien_compris'
 * }
 * Auth: Bearer JWT requis
 *
 * §17 Cahier des charges — Suivi académique
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import { getCorsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { verifyAuth } from "../_shared/auth.ts";
import { rateLimit, rateLimitHeaders } from "../_shared/ratelimit.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";

const log = logger("session-report");

const RATE_MAX = 30;
const RATE_WINDOW_MS = 60_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MENTOR_COMPREHENSION = ["insuffisant", "en_progres", "acquis", "excellent"] as const;
const ETUDIANT_COMPREHENSION = ["incompris", "partiellement", "bien_compris", "tres_bien_compris"] as const;

type MentorComp = (typeof MENTOR_COMPREHENSION)[number];
type EtudiantComp = (typeof ETUDIANT_COMPREHENSION)[number];

function validateBody(raw: unknown): {
  ok: true;
  session_id: string;
  mentor_fields: Record<string, unknown> | null;
  etudiant_comprehension: EtudiantComp | null;
} | { ok: false; status: number; error: string } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "Le corps de la requête doit être un objet JSON" };
  }
  const obj = raw as Record<string, unknown>;

  if (!obj.session_id || typeof obj.session_id !== "string" || !UUID_RE.test(obj.session_id)) {
    return { ok: false, status: 422, error: "'session_id' doit être un UUID valide" };
  }

  // Vérifier si c'est une mise à jour étudiant (niveau compréhension uniquement)
  const etudiantComp = obj.niveau_comprehension_etudiant;
  if (etudiantComp !== undefined) {
    if (typeof etudiantComp !== "string" || !(ETUDIANT_COMPREHENSION as readonly string[]).includes(etudiantComp)) {
      return {
        ok: false, status: 422,
        error: `'niveau_comprehension_etudiant' doit être l'une des valeurs: ${ETUDIANT_COMPREHENSION.join(", ")}`,
      };
    }
    return { ok: true, session_id: obj.session_id, mentor_fields: null, etudiant_comprehension: etudiantComp as EtudiantComp };
  }

  // Sinon c'est un rapport mentor — valider les champs optionnels
  const mentorComp = obj.niveau_comprehension_mentor;
  if (mentorComp !== undefined && (typeof mentorComp !== "string" || !(MENTOR_COMPREHENSION as readonly string[]).includes(mentorComp))) {
    return {
      ok: false, status: 422,
      error: `'niveau_comprehension_mentor' doit être: ${MENTOR_COMPREHENSION.join(", ")}`,
    };
  }

  const textFields: string[] = ["sujet_traite", "notions_abordees", "difficultes_observees", "exercices_realises", "recommandations", "objectif_prochaine_seance"];
  for (const field of textFields) {
    if (obj[field] !== undefined && typeof obj[field] !== "string") {
      return { ok: false, status: 422, error: `'${field}' doit être une chaîne de caractères` };
    }
    if (typeof obj[field] === "string" && (obj[field] as string).length > 2000) {
      return { ok: false, status: 422, error: `'${field}' dépasse 2000 caractères` };
    }
  }

  const mentor_fields: Record<string, unknown> = {};
  for (const field of textFields) {
    if (obj[field] !== undefined) mentor_fields[field] = (obj[field] as string).trim();
  }
  if (mentorComp !== undefined) mentor_fields["niveau_comprehension_mentor"] = mentorComp;

  if (Object.keys(mentor_fields).length === 0) {
    return { ok: false, status: 400, error: "Aucun champ à mettre à jour fourni" };
  }

  return { ok: true, session_id: obj.session_id, mentor_fields, etudiant_comprehension: null };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsOptionsResponse(req);
  if (req.method !== "POST") {
    return errorResponse("Méthode non autorisée. Utilisez POST.", 405, { ...corsHeaders, Allow: "POST" });
  }

  const auth = await verifyAuth(req);
  if (!auth.ok) {
    log.warn("Auth échouée", { status: auth.status });
    return errorResponse(auth.error, auth.status, corsHeaders);
  }

  const rl = rateLimit(`report:${auth.userId}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return errorResponse("Trop de requêtes.", 429, corsHeaders, undefined, rateLimitHeaders(0, rl.resetAt));
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse("Corps de requête JSON invalide", 400, corsHeaders);
  }

  const parsed = validateBody(rawBody);
  if (!parsed.ok) {
    return errorResponse(parsed.error, parsed.status, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
  }

  const { session_id, mentor_fields, etudiant_comprehension } = parsed;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Récupérer la session pour vérifier les droits
    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("id, mentor_id, mentore_id, statut, matiere_id")
      .eq("id", session_id)
      .maybeSingle();

    if (sessErr) throw sessErr;
    if (!session) {
      return errorResponse("Session introuvable", 404, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
    }

    const isMentor = session.mentor_id === auth.userId;
    const isMentore = session.mentore_id === auth.userId;

    if (!isMentor && !isMentore) {
      return errorResponse("Accès refusé : vous ne participez pas à cette session", 403, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
    }

    // RG05 CDC : une séance terminée peut être évaluée / suivie
    // On permet aussi 'en_cours' pour les rapports en temps réel
    if (!["en_cours", "terminee"].includes(session.statut)) {
      return errorResponse(
        "Un rapport ne peut être renseigné que pour une session en cours ou terminée",
        422,
        corsHeaders,
        undefined,
        rateLimitHeaders(rl.remaining, rl.resetAt),
      );
    }

    // Vérifier les droits selon le rôle
    if (etudiant_comprehension !== null && !isMentore) {
      return errorResponse("Seul l'étudiant peut renseigner son niveau de compréhension", 403, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
    }
    if (mentor_fields !== null && !isMentor) {
      return errorResponse("Seul le mentor peut renseigner le rapport de séance", 403, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
    }

    // Vérifier si un suivi existe déjà
    const { data: existing, error: existErr } = await supabase
      .from("suivi_seances")
      .select("id")
      .eq("session_id", session_id)
      .maybeSingle();

    if (existErr) throw existErr;

    let result;

    if (etudiant_comprehension !== null) {
      // Mise à jour étudiant — uniquement niveau compréhension
      if (!existing) {
        // Créer le suivi avec le mentor_id pour satisfaire la contrainte
        const { data, error } = await supabase
          .from("suivi_seances")
          .insert({
            session_id,
            mentor_id: session.mentor_id,
            niveau_comprehension_etudiant: etudiant_comprehension,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("suivi_seances")
          .update({ niveau_comprehension_etudiant: etudiant_comprehension, updated_at: new Date().toISOString() })
          .eq("session_id", session_id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      log.info("Niveau compréhension étudiant mis à jour", { session_id, etudiant: auth.userId });
    } else {
      // Rapport mentor (UPSERT)
      const upsertData = {
        session_id,
        mentor_id: session.mentor_id,
        ...mentor_fields,
        updated_at: new Date().toISOString(),
      };

      if (!existing) {
        const { data, error } = await supabase.from("suivi_seances").insert(upsertData).select().single();
        if (error) throw error;
        result = data;
        log.info("Suivi de séance créé", { session_id, mentor: auth.userId });
      } else {
        const { data, error } = await supabase
          .from("suivi_seances")
          .update({ ...mentor_fields, updated_at: new Date().toISOString() })
          .eq("session_id", session_id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        log.info("Suivi de séance mis à jour", { session_id, mentor: auth.userId });
      }
    }

    return jsonResponse(
      { success: true, suivi: result },
      existing ? 200 : 201,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  } catch (err) {
    log.error("Erreur session-report", { error: String(err) });
    return errorResponse("Erreur interne lors de l'enregistrement du suivi", 500, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
  }
});
