/**
 * Admin Stats Edge Function — MentorUADB
 *
 * Retourne les KPIs du tableau de bord administrateur.
 * Accès restreint aux utilisateurs avec is_admin = true.
 *
 * GET /functions/v1/admin-stats
 * Auth: Bearer JWT requis (admin uniquement)
 *
 * Réponse: {
 *   dashboard: { ...KPIs globaux },
 *   matieres: [ ...stats par matière ],
 *   mentors_top: [ ...top mentors par note ],
 *   evolution_mensuelle: [ ...nb sessions par mois ]
 * }
 *
 * §23-24 Cahier des charges — Tableau de bord administrateur / Statistiques
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import { getCorsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { verifyAuth } from "../_shared/auth.ts";
import { rateLimit, rateLimitHeaders } from "../_shared/ratelimit.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";

const log = logger("admin-stats");

const RATE_MAX = 20;
const RATE_WINDOW_MS = 60_000;

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsOptionsResponse(req);
  if (req.method !== "GET") {
    return errorResponse("Méthode non autorisée. Utilisez GET.", 405, { ...corsHeaders, Allow: "GET" });
  }

  const auth = await verifyAuth(req);
  if (!auth.ok) {
    log.warn("Auth échouée", { status: auth.status });
    return errorResponse(auth.error, auth.status, corsHeaders);
  }

  const rl = rateLimit(`admin-stats:${auth.userId}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return errorResponse("Trop de requêtes.", 429, corsHeaders, undefined, rateLimitHeaders(0, rl.resetAt));
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", auth.userId)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (!profile?.is_admin) {
      log.warn("Accès admin refusé", { userId: auth.userId });
      return errorResponse("Accès réservé aux administrateurs", 403, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
    }

    // ── 1. KPIs GLOBAUX (§23 CDC) ────────────────────────────────
    const [
      { data: profileStats },
      { data: sessionStats },
      { data: demandeStats },
      { data: evalStats },
      { data: signalStats },
      { data: ressourceStats },
    ] = await Promise.all([
      supabase.rpc("get_profile_stats").single().catch(() => ({ data: null })),
      supabase.rpc("get_session_stats").single().catch(() => ({ data: null })),
      supabase.rpc("get_demande_stats").single().catch(() => ({ data: null })),
      supabase.rpc("get_eval_stats").single().catch(() => ({ data: null })),
      supabase.rpc("get_signal_stats").single().catch(() => ({ data: null })),
      supabase.rpc("get_ressource_stats").single().catch(() => ({ data: null })),
    ]);

    // Requêtes directes si les RPCs ne sont pas définies
    const [
      { count: nbEtudiants },
      { count: nbMentors },
      { count: nbMentorsValides },
      { count: nbEnAttente },
      { count: nbSessionsTotal },
      { count: nbSessionsTerminees },
      { count: nbSessionsAnnulees },
      { count: nbDemandesTotal },
      { count: nbDemandesAcceptees },
      { count: nbDemandesRefusees },
      { count: nbSignalementsOuverts },
      { count: nbRessources },
      { count: nbMessages },
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_mentore", true).eq("is_mentor", false),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_mentor", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_mentor", true).eq("statut_validation", "valide"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("statut_validation", "en_attente"),
      supabase.from("sessions").select("id", { count: "exact", head: true }),
      supabase.from("sessions").select("id", { count: "exact", head: true }).eq("statut", "terminee"),
      supabase.from("sessions").select("id", { count: "exact", head: true }).eq("statut", "annulee"),
      supabase.from("demandes_mentorat").select("id", { count: "exact", head: true }),
      supabase.from("demandes_mentorat").select("id", { count: "exact", head: true }).eq("statut", "acceptee"),
      supabase.from("demandes_mentorat").select("id", { count: "exact", head: true }).eq("statut", "refusee"),
      supabase.from("signalements").select("id", { count: "exact", head: true }).eq("statut", "ouvert"),
      supabase.from("ressources").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
    ]);

    // Note moyenne globale
    const { data: evalData } = await supabase
      .from("evaluations")
      .select("note_globale, note");

    const evalList = evalData ?? [];
    const notesMoyenne = evalList.length > 0
      ? Math.round(
          (evalList.reduce((acc: number, e: Record<string, unknown>) =>
            acc + (Number(e.note_globale) || Number(e.note) || 0), 0) / evalList.length) * 100
        ) / 100
      : 0;

    const totalDemandes = nbDemandesTotal ?? 0;
    const totalSessions = nbSessionsTotal ?? 0;

    const dashboard = {
      // Utilisateurs
      nb_etudiants: nbEtudiants ?? 0,
      nb_mentors: nbMentors ?? 0,
      nb_mentors_valides: nbMentorsValides ?? 0,
      nb_en_attente_validation: nbEnAttente ?? 0,
      // Sessions
      nb_sessions_total: totalSessions,
      nb_sessions_terminees: nbSessionsTerminees ?? 0,
      nb_sessions_annulees: nbSessionsAnnulees ?? 0,
      taux_annulation_pct: totalSessions > 0
        ? Math.round(((nbSessionsAnnulees ?? 0) / totalSessions) * 1000) / 10
        : 0,
      // Demandes
      nb_demandes_total: totalDemandes,
      nb_demandes_acceptees: nbDemandesAcceptees ?? 0,
      nb_demandes_refusees: nbDemandesRefusees ?? 0,
      taux_acceptation_pct: totalDemandes > 0
        ? Math.round(((nbDemandesAcceptees ?? 0) / totalDemandes) * 1000) / 10
        : 0,
      // Évaluations
      note_moyenne_globale: notesMoyenne,
      nb_evaluations: evalList.length,
      // Autres
      nb_signalements_ouverts: nbSignalementsOuverts ?? 0,
      nb_ressources: nbRessources ?? 0,
      nb_messages: nbMessages ?? 0,
    };

    // ── 2. STATS PAR MATIÈRE (§24 CDC — matières les plus demandées) ─
    const { data: matieres, error: matErr } = await supabase
      .from("matieres")
      .select(`
        id, nom, code,
        demandes_mentorat(id, statut),
        sessions(id, statut),
        mentor_matieres(mentor_id)
      `);

    if (matErr) throw matErr;

    const statsMatières = (matieres ?? []).map((m: Record<string, unknown>) => {
      const demandes = (m.demandes_mentorat as unknown[]) ?? [];
      const sessions = (m.sessions as unknown[]) ?? [];
      const mentors = (m.mentor_matieres as unknown[]) ?? [];
      return {
        id: m.id,
        nom: m.nom,
        code: m.code,
        nb_demandes: demandes.length,
        nb_sessions: sessions.length,
        nb_sessions_terminees: sessions.filter((s: unknown) => (s as Record<string, unknown>).statut === "terminee").length,
        nb_mentors: mentors.length,
      };
    }).sort((a: Record<string, number>, b: Record<string, number>) => b.nb_demandes - a.nb_demandes);

    // ── 3. TOP MENTORS PAR NOTE (§24 CDC) ──────────────────────────
    const { data: topMentors, error: mentorErr } = await supabase
      .from("profiles")
      .select(`
        id, nom, prenom, photo_url,
        evaluations!evaluations_evalue_id_fkey(note_globale, note),
        sessions!sessions_mentor_id_fkey(id, statut)
      `)
      .eq("is_mentor", true)
      .eq("statut_validation", "valide")
      .limit(10);

    if (mentorErr) throw mentorErr;

    const topMentorsFormatted = (topMentors ?? [])
      .map((m: Record<string, unknown>) => {
        const evals = (m.evaluations as Record<string, unknown>[]) ?? [];
        const sessions = (m.sessions as Record<string, unknown>[]) ?? [];
        const noteMoy = evals.length > 0
          ? Math.round(
              (evals.reduce((acc, e) => acc + (Number(e.note_globale) || Number(e.note) || 0), 0) / evals.length) * 10
            ) / 10
          : 0;
        return {
          mentor_id: m.id,
          nom: m.nom,
          prenom: m.prenom,
          photo_url: m.photo_url,
          note_moyenne: noteMoy,
          nb_evaluations: evals.length,
          nb_sessions_terminees: sessions.filter((s) => s.statut === "terminee").length,
        };
      })
      .sort((a: Record<string, number>, b: Record<string, number>) => b.note_moyenne - a.note_moyenne)
      .slice(0, 5);

    // ── 4. ÉVOLUTION MENSUELLE (6 derniers mois) ───────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: sessionsRecentes, error: sessRecentErr } = await supabase
      .from("sessions")
      .select("created_at, statut")
      .gte("created_at", sixMonthsAgo.toISOString());

    if (sessRecentErr) throw sessRecentErr;

    const evolutionMap: Record<string, { mois: string; nb_sessions: number; nb_terminees: number }> = {};
    (sessionsRecentes ?? []).forEach((s: Record<string, unknown>) => {
      const d = new Date(s.created_at as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!evolutionMap[key]) {
        evolutionMap[key] = { mois: key, nb_sessions: 0, nb_terminees: 0 };
      }
      evolutionMap[key].nb_sessions++;
      if (s.statut === "terminee") evolutionMap[key].nb_terminees++;
    });

    const evolutionMensuelle = Object.values(evolutionMap).sort((a, b) => a.mois.localeCompare(b.mois));

    // ── 5. COMPTES EN ATTENTE DE VALIDATION ────────────────────────
    const { data: enAttenteComptes, error: attenteErr } = await supabase
      .from("profiles")
      .select("id, nom, prenom, is_mentor, is_mentore, created_at, filiere_id, niveau_id")
      .eq("statut_validation", "en_attente")
      .order("created_at", { ascending: true })
      .limit(20);

    if (attenteErr) throw attenteErr;

    log.info("Admin stats générées", { userId: auth.userId });

    return jsonResponse(
      {
        dashboard,
        matieres: statsMatières,
        mentors_top: topMentorsFormatted,
        evolution_mensuelle: evolutionMensuelle,
        comptes_en_attente: enAttenteComptes ?? [],
        generated_at: new Date().toISOString(),
      },
      200,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  } catch (err) {
    log.error("Erreur admin-stats", { error: String(err) });
    return errorResponse("Erreur interne lors de la génération des statistiques", 500, corsHeaders, undefined, rateLimitHeaders(rl.remaining, rl.resetAt));
  }
});
