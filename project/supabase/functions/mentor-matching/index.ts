/**
 * Mentor Matching Edge Function — MentorUADB
 *
 * Validates JWT, enforces rate limiting, validates input (UUID format), returns
 * structured errors (400/401/404/422/429/500), logs in structured JSON,
 * restricts CORS to the frontend.
 *
 * POST /functions/v1/mentor-matching
 * Body: { "matiere_id": string (UUID), "niveau_id"?: string (UUID) }
 * Auth: Bearer JWT required
 *
 * Returns ranked list of mentors with a composite score:
 *   rating (40) + availability (30) + same level (20) + expertise (10)
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import { getCorsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { verifyAuth } from "../_shared/auth.ts";
import { rateLimit, rateLimitHeaders } from "../_shared/ratelimit.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";

const log = logger("mentor-matching");

const RATE_MAX = 30;
const RATE_WINDOW_MS = 60_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MatchResult = {
  mentor_id: string;
  nom: string;
  prenom: string;
  bio: string | null;
  photo_url: string | null;
  niveau_expertise: string;
  note_moyenne: number;
  nombre_evaluations: number;
  nombre_disponibilites: number;
  score: number;
};

function validateBody(raw: unknown): { ok: true; matiere_id: string; niveau_id: string | null } | { ok: false; status: number; error: string } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "Le corps de la requête doit être un objet JSON" };
  }
  const obj = raw as Record<string, unknown>;
  const matiere_id = obj.matiere_id;
  if (matiere_id === undefined || matiere_id === null) {
    return { ok: false, status: 400, error: "Le champ 'matiere_id' est requis" };
  }
  if (typeof matiere_id !== "string" || !UUID_RE.test(matiere_id)) {
    return { ok: false, status: 422, error: "Le champ 'matiere_id' doit être un UUID valide" };
  }
  let niveau_id: string | null = null;
  if (obj.niveau_id !== undefined && obj.niveau_id !== null) {
    if (typeof obj.niveau_id !== "string" || !UUID_RE.test(obj.niveau_id)) {
      return { ok: false, status: 422, error: "Le champ 'niveau_id' doit être un UUID valide" };
    }
    niveau_id = obj.niveau_id;
  }
  return { ok: true, matiere_id, niveau_id };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsOptionsResponse(req);
  if (req.method !== "POST") {
    return errorResponse("Méthode non autorisée. Utilisez POST.", 405, { ...corsHeaders, "Allow": "POST" });
  }

  const auth = await verifyAuth(req);
  if (!auth.ok) {
    log.warn("Auth échouée", { status: auth.status });
    return errorResponse(auth.error, auth.status, corsHeaders);
  }

  const rl = rateLimit(`matching:${auth.userId}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.allowed) {
    log.warn("Rate limit dépassé", { userId: auth.userId });
    return errorResponse(
      "Trop de requêtes. Réessayez dans un instant.",
      429,
      corsHeaders,
      undefined,
      rateLimitHeaders(0, rl.resetAt),
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse("Corps de requête JSON invalide", 400, corsHeaders);
  }

  const parsed = validateBody(rawBody);
  if (!parsed.ok) {
    log.warn("Validation échouée", { status: parsed.status, error: parsed.error });
    return errorResponse(parsed.error, parsed.status, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
  }

  const { matiere_id, niveau_id } = parsed;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Verify the matiere exists
    const { data: matiere, error: matiereError } = await supabase
      .from("matieres")
      .select("id")
      .eq("id", matiere_id)
      .maybeSingle();

    if (matiereError) throw matiereError;
    if (!matiere) {
      log.warn("Matière introuvable", { matiere_id });
      return errorResponse("Matière introuvable", 404, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
    }

    const { data: mentorMatieres, error: mmError } = await supabase
      .from("mentor_matieres")
      .select(`
        mentor_id,
        niveau_expertise,
        matiere:matieres(*),
        mentor:profiles!mentor_matieres_mentor_id_fkey(
          id, nom, prenom, bio, photo_url, filiere_id, niveau_id,
          statut_validation
        )
      `)
      .eq("matiere_id", matiere_id);

    if (mmError) throw mmError;

    const mentorIds = (mentorMatieres ?? []).map((mm: any) => mm.mentor_id);

    const availabilities: Record<string, number> = {};
    const evaluations: Record<string, { avg: number; count: number }> = {};

    if (mentorIds.length > 0) {
      const { data: dispos, error: disposError } = await supabase
        .from("disponibilites")
        .select("mentor_id")
        .in("mentor_id", mentorIds);

      if (disposError) throw disposError;

      (dispos ?? []).forEach((d: any) => {
        availabilities[d.mentor_id] = (availabilities[d.mentor_id] ?? 0) + 1;
      });

      const { data: evals, error: evalsError } = await supabase
        .from("evaluations")
        .select("evalue_id, note")
        .in("evalue_id", mentorIds);

      if (evalsError) throw evalsError;

      (evals ?? []).forEach((e: any) => {
        if (!evaluations[e.evalue_id]) {
          evaluations[e.evalue_id] = { avg: 0, count: 0 };
        }
        evaluations[e.evalue_id].avg += e.note;
        evaluations[e.evalue_id].count += 1;
      });

      Object.keys(evaluations).forEach((id) => {
        if (evaluations[id].count > 0) {
          evaluations[id].avg = evaluations[id].avg / evaluations[id].count;
        }
      });
    }

    const expertiseMap: Record<string, number> = { expert: 10, avance: 7, intermediaire: 5, debutant: 3 };

    const scored: MatchResult[] = (mentorMatieres ?? [])
      .filter((mm: any) => mm.mentor?.statut_validation === "valide")
      .map((mm: any) => {
        const mentor = mm.mentor;
        const evalData = evaluations[mentor.id] ?? { avg: 0, count: 0 };
        const dispoCount = availabilities[mentor.id] ?? 0;

        let score = 0;
        score += evalData.avg * 8;
        score += Math.min(dispoCount * 6, 30);
        score += niveau_id && mentor.niveau_id === niveau_id ? 20 : 0;
        score += expertiseMap[mm.niveau_expertise] ?? 5;

        return {
          mentor_id: mentor.id,
          nom: mentor.nom,
          prenom: mentor.prenom,
          bio: mentor.bio,
          photo_url: mentor.photo_url,
          niveau_expertise: mm.niveau_expertise,
          note_moyenne: Math.round(evalData.avg * 10) / 10,
          nombre_evaluations: evalData.count,
          nombre_disponibilites: dispoCount,
          score: Math.round(score),
        };
      })
      .sort((a, b) => b.score - a.score);

    log.info("Matching réussi", { matiere_id, total: scored.length });

    return jsonResponse(
      { mentors: scored, total: scored.length },
      200,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  } catch (err) {
    log.error("Erreur matching", { error: String(err) });
    return errorResponse(
      "Erreur lors de la recherche de mentors",
      500,
      corsHeaders,
      undefined,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  }
});
