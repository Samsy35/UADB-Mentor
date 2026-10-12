/**
 * Mentor Matching Edge Function — MentorUADB (v2)
 *
 * Aligné sur le §12 du cahier des charges :
 *   Matière       : 35 % (filtrage — déjà satisfait par la requête)
 *   Niveau adapté : 20 %
 *   Disponibilité : 20 %
 *   Compétence    : 15 %
 *   Évaluation    : 10 %
 *
 * Filtres supplémentaires (optionnels) :
 *   - mode         : 'en_ligne' | 'presentiel' | 'les_deux'
 *   - jour_semaine : 0-6 (0=dimanche)
 *   - filiere_id   : UUID
 *
 * POST /functions/v1/mentor-matching
 * Body: {
 *   matiere_id: string (UUID, requis),
 *   niveau_id?: string (UUID),
 *   mode?: string,
 *   jour_semaine?: number (0-6),
 *   filiere_id?: string (UUID)
 * }
 * Auth: Bearer JWT requis
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

// §12 CDC — Pondération officielle (total = 100%)
const WEIGHT = {
  MATIERE: 35,      // satisfait par le filtre SQL
  NIVEAU:  20,      // même niveau ou niveau inférieur du mentor
  DISPO:   20,      // disponibilités normalisées
  COMPETENCE: 15,   // niveau d'expertise déclaré
  EVALUATION: 10,   // note moyenne sur 5
} as const;

// Scores expertise → 0-100
const EXPERTISE_SCORE: Record<string, number> = {
  expert: 100,
  avance: 75,
  intermediaire: 50,
  debutant: 25,
};

type MatchResult = {
  mentor_id: string;
  nom: string;
  prenom: string;
  bio: string | null;
  photo_url: string | null;
  niveau_expertise: string;
  mode_preference: string | null;
  experience: string | null;
  note_moyenne: number;
  nombre_evaluations: number;
  nombre_disponibilites: number;
  // Sous-scores détaillés (transparence)
  score_niveau: number;
  score_disponibilite: number;
  score_competence: number;
  score_evaluation: number;
  score_total: number;   // /100
};

type FilterInput = {
  matiere_id: string;
  niveau_id: string | null;
  mode: string | null;
  jour_semaine: number | null;
  filiere_id: string | null;
};

function validateBody(raw: unknown): { ok: true } & FilterInput | { ok: false; status: number; error: string } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "Le corps de la requête doit être un objet JSON" };
  }
  const obj = raw as Record<string, unknown>;

  // matiere_id — requis
  if (!obj.matiere_id || typeof obj.matiere_id !== "string" || !UUID_RE.test(obj.matiere_id)) {
    return { ok: false, status: obj.matiere_id === undefined ? 400 : 422, error: "'matiere_id' doit être un UUID valide" };
  }

  // niveau_id — optionnel
  let niveau_id: string | null = null;
  if (obj.niveau_id !== undefined && obj.niveau_id !== null) {
    if (typeof obj.niveau_id !== "string" || !UUID_RE.test(obj.niveau_id)) {
      return { ok: false, status: 422, error: "'niveau_id' doit être un UUID valide" };
    }
    niveau_id = obj.niveau_id;
  }

  // mode — optionnel
  const VALID_MODES = ["en_ligne", "presentiel", "les_deux"];
  let mode: string | null = null;
  if (obj.mode !== undefined && obj.mode !== null) {
    if (typeof obj.mode !== "string" || !VALID_MODES.includes(obj.mode)) {
      return { ok: false, status: 422, error: `'mode' doit être: ${VALID_MODES.join(", ")}` };
    }
    mode = obj.mode;
  }

  // jour_semaine — optionnel (0-6)
  let jour_semaine: number | null = null;
  if (obj.jour_semaine !== undefined && obj.jour_semaine !== null) {
    const js = Number(obj.jour_semaine);
    if (!Number.isInteger(js) || js < 0 || js > 6) {
      return { ok: false, status: 422, error: "'jour_semaine' doit être un entier entre 0 (dimanche) et 6 (samedi)" };
    }
    jour_semaine = js;
  }

  // filiere_id — optionnel
  let filiere_id: string | null = null;
  if (obj.filiere_id !== undefined && obj.filiere_id !== null) {
    if (typeof obj.filiere_id !== "string" || !UUID_RE.test(obj.filiere_id)) {
      return { ok: false, status: 422, error: "'filiere_id' doit être un UUID valide" };
    }
    filiere_id = obj.filiere_id;
  }

  return { ok: true, matiere_id: obj.matiere_id, niveau_id, mode, jour_semaine, filiere_id };
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

  const rl = rateLimit(`matching:${auth.userId}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return errorResponse("Trop de requêtes. Réessayez dans un instant.", 429, corsHeaders, undefined, rateLimitHeaders(0, rl.resetAt));
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

  const { matiere_id, niveau_id, mode, jour_semaine, filiere_id } = parsed;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Vérifier que la matière existe
    const { data: matiere, error: matiereError } = await supabase
      .from("matieres")
      .select("id, nom")
      .eq("id", matiere_id)
      .maybeSingle();

    if (matiereError) throw matiereError;
    if (!matiere) {
      return errorResponse("Matière introuvable", 404, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
    }

    // Requête principale : mentors avec cette matière (validés uniquement — RG02)
    const { data: mentorMatieres, error: mmError } = await supabase
      .from("mentor_matieres")
      .select(`
        mentor_id,
        niveau_expertise,
        mentor:profiles!mentor_matieres_mentor_id_fkey(
          id, nom, prenom, bio, photo_url,
          filiere_id, niveau_id,
          mode_preference, experience, nb_etudiants_max,
          statut_validation
        )
      `)
      .eq("matiere_id", matiere_id);

    if (mmError) throw mmError;

    // Filtrer sur statut_validation = 'valide' (RG02 CDC)
    let filteredMentors = (mentorMatieres ?? []).filter(
      (mm: Record<string, unknown>) => (mm.mentor as Record<string, unknown>)?.statut_validation === "valide",
    );

    // Filtre filière (optionnel)
    if (filiere_id) {
      filteredMentors = filteredMentors.filter(
        (mm: Record<string, unknown>) => (mm.mentor as Record<string, unknown>)?.filiere_id === filiere_id,
      );
    }

    const mentorIds = filteredMentors.map((mm: Record<string, unknown>) => mm.mentor_id as string);

    if (mentorIds.length === 0) {
      log.info("Aucun mentor trouvé", { matiere_id });
      return jsonResponse({ mentors: [], total: 0, matiere: matiere.nom }, 200, corsHeaders, rateLimitHeaders(rl.remaining, rl.resetAt));
    }

    // Disponibilités — avec filtre optionnel mode + jour
    let disposQuery = supabase
      .from("disponibilites")
      .select("mentor_id, jour_semaine, mode")
      .in("mentor_id", mentorIds);

    if (jour_semaine !== null) {
      disposQuery = disposQuery.eq("jour_semaine", jour_semaine);
    }
    if (mode && mode !== "les_deux") {
      disposQuery = disposQuery.in("mode", [mode, "les_deux"]);
    }

    const { data: dispos, error: disposError } = await disposQuery;
    if (disposError) throw disposError;

    // Si filtre jour/mode actif, exclure les mentors sans créneau correspondant
    let mentorIdsFiltered = mentorIds;
    if (jour_semaine !== null || (mode && mode !== "les_deux")) {
      const mentorsWithDispo = new Set((dispos ?? []).map((d: Record<string, unknown>) => d.mentor_id));
      mentorIdsFiltered = mentorIds.filter((id: string) => mentorsWithDispo.has(id));
      if (mentorIdsFiltered.length === 0) {
        return jsonResponse({ mentors: [], total: 0, matiere: matiere.nom }, 200, corsHeaders, rateLimitHeaders(rl.remaining, rl.resetAt));
      }
    }

    // Compter disponibilités par mentor
    const availabilities: Record<string, number> = {};
    (dispos ?? []).forEach((d: Record<string, unknown>) => {
      const mid = d.mentor_id as string;
      availabilities[mid] = (availabilities[mid] ?? 0) + 1;
    });

    // Évaluations (note_globale en priorité, sinon note simple)
    const { data: evals, error: evalsError } = await supabase
      .from("evaluations")
      .select("evalue_id, note_globale, note")
      .in("evalue_id", mentorIdsFiltered);

    if (evalsError) throw evalsError;

    const evaluations: Record<string, { sum: number; count: number }> = {};
    (evals ?? []).forEach((e: Record<string, unknown>) => {
      const mid = e.evalue_id as string;
      const note = Number(e.note_globale) || Number(e.note) || 0;
      if (!evaluations[mid]) evaluations[mid] = { sum: 0, count: 0 };
      evaluations[mid].sum += note;
      evaluations[mid].count += 1;
    });

    // Nombre maximum de disponibilités parmi tous les mentors (pour normalisation)
    const maxDispos = Math.max(1, ...Object.values(availabilities));

    // ── CALCUL DU SCORE (§12 CDC) ──────────────────────────────────
    // Score total = 100 pts
    // Matière (35%) : déjà filtré → tous ont 35 pts de base
    // Niveau  (20%) : mentor niveau ≥ étudiant → +20 pts
    // Dispo   (20%) : normalisé sur le maximum → 0-20 pts
    // Compét  (15%) : expertise 0-100% → 0-15 pts
    // Éval    (10%) : note moy / 5 → 0-10 pts

    const scored: MatchResult[] = filteredMentors
      .filter((mm: Record<string, unknown>) => mentorIdsFiltered.includes(mm.mentor_id as string))
      .map((mm: Record<string, unknown>) => {
        const mentor = mm.mentor as Record<string, unknown>;
        const evalData = evaluations[mentor.id as string] ?? { sum: 0, count: 0 };
        const noteMoy = evalData.count > 0 ? evalData.sum / evalData.count : 0;
        const dispoCount = availabilities[mentor.id as string] ?? 0;
        const expertiseScore = EXPERTISE_SCORE[mm.niveau_expertise as string] ?? 50;

        const scoreNiveau = (niveau_id && mentor.niveau_id === niveau_id) ? WEIGHT.NIVEAU : 0;
        const scoreDispo = Math.round((dispoCount / maxDispos) * WEIGHT.DISPO);
        const scoreCompetence = Math.round((expertiseScore / 100) * WEIGHT.COMPETENCE);
        const scoreEvaluation = Math.round((noteMoy / 5) * WEIGHT.EVALUATION);
        const scoreTotal = WEIGHT.MATIERE + scoreNiveau + scoreDispo + scoreCompetence + scoreEvaluation;

        return {
          mentor_id: mentor.id as string,
          nom: mentor.nom as string,
          prenom: mentor.prenom as string,
          bio: mentor.bio as string | null,
          photo_url: mentor.photo_url as string | null,
          niveau_expertise: mm.niveau_expertise as string,
          mode_preference: mentor.mode_preference as string | null,
          experience: mentor.experience as string | null,
          note_moyenne: Math.round(noteMoy * 10) / 10,
          nombre_evaluations: evalData.count,
          nombre_disponibilites: dispoCount,
          // Sous-scores pour transparence (frontend peut les afficher)
          score_niveau: scoreNiveau,
          score_disponibilite: scoreDispo,
          score_competence: scoreCompetence,
          score_evaluation: scoreEvaluation,
          score_total: scoreTotal,
        };
      })
      .sort((a, b) => b.score_total - a.score_total);

    log.info("Matching réussi", { matiere_id, total: scored.length, filtres: { niveau_id, mode, jour_semaine } });

    return jsonResponse(
      { mentors: scored, total: scored.length, matiere: matiere.nom },
      200,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  } catch (err) {
    log.error("Erreur matching", { error: String(err) });
    return errorResponse("Erreur lors de la recherche de mentors", 500, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
  }
});
