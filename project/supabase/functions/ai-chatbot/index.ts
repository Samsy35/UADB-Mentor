/**
 * AI Chatbot Edge Function — MentorUADB
 *
 * Validates JWT, enforces rate limiting, validates input, returns structured
 * errors (400/401/422/429/500), logs in structured JSON, restricts CORS to the frontend.
 *
 * POST /functions/v1/ai-chatbot
 * Body: { "message": string, "history"?: Array<{role: "user"|"assistant", content: string}> }
 * Auth: Bearer JWT required
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, corsOptionsResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { verifyAuth } from "../_shared/auth.ts";
import { rateLimit, rateLimitHeaders } from "../_shared/ratelimit.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";

const log = logger("ai-chatbot");

const SYSTEM_PROMPT = `Tu es l'assistant IA de MentorUADB, la plateforme de mentorat académique de l'Université Alioune Diop de Bambey (UADB) au Sénégal.

Ton rôle :
- Répondre aux questions fréquentes sur le fonctionnement de la plateforme
- Aider les étudiants à formuler leur demande (ex: "je ne comprends pas les intégrales" → orienter vers "Analyse Mathématique")
- Orienter vers un mentor disponible si la question nécessite un accompagnement
- Donner des conseils méthodologiques de révision et d'organisation

Informations sur l'UADB :
- UFR SATIC (Ngoundiane) : Mathématiques, Physique, Chimie, TIC (Développement Web, Administration Réseau, Création Multimédia)
- UFR SDD (Diourbel) : Santé Communautaire, Développement Durable et Environnement
- UFR ECOMIJ (Bambey) : Économie, Finance-Comptabilité, Management, Ingénierie Juridique
- ISFAR (Bambey) : Agriculture, Élevage, Foresterie, Génie Rural
- École Doctorale EDSTSS : Doctorats pluridisciplinaires

Fonctionnement de la plateforme :
1. Inscription avec rôle mentoré et/ou mentor
2. Recherche de mentor par matière via "Trouver un mentor"
3. Demande de session (en ligne ou présentiel)
4. Messagerie entre mentor et mentoré
5. Évaluation après session

Réponds toujours en français, de manière concise et bienveillante. Si la question porte sur un cours précis, encourage l'étudiant à prendre une session avec un mentor dans la matière correspondante.`;

const MAX_MESSAGE_LEN = 2000;
const MAX_HISTORY = 10;
const RATE_MAX = 20;
const RATE_WINDOW_MS = 60_000;

type ChatTurn = { role: "user" | "assistant"; content: string };

function validateBody(raw: unknown): { ok: true; message: string; history: ChatTurn[] } | { ok: false; status: number; error: string; details?: unknown } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "Le corps de la requête doit être un objet JSON" };
  }
  const obj = raw as Record<string, unknown>;
  const message = obj.message;
  if (message === undefined || message === null) {
    return { ok: false, status: 400, error: "Le champ 'message' est requis" };
  }
  if (typeof message !== "string") {
    return { ok: false, status: 422, error: "Le champ 'message' doit être une chaîne de caractères" };
  }
  if (message.trim().length === 0) {
    return { ok: false, status: 422, error: "Le champ 'message' ne peut pas être vide" };
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return { ok: false, status: 422, error: `Le champ 'message' dépasse la longueur maximale (${MAX_MESSAGE_LEN} caractères)` };
  }

  let history: ChatTurn[] = [];
  if (obj.history !== undefined && obj.history !== null) {
    if (!Array.isArray(obj.history)) {
      return { ok: false, status: 422, error: "Le champ 'history' doit être un tableau" };
    }
    if (obj.history.length > MAX_HISTORY) {
      return { ok: false, status: 422, error: `Le champ 'history' dépasse ${MAX_HISTORY} entrées` };
    }
    for (let i = 0; i < obj.history.length; i++) {
      const h = obj.history[i] as Record<string, unknown>;
      if (!h || typeof h !== "object" || typeof h.role !== "string" || typeof h.content !== "string") {
        return { ok: false, status: 422, error: `Entrée history[${i}] invalide: 'role' et 'content' doivent être des chaînes` };
      }
      if (h.role !== "user" && h.role !== "assistant") {
        return { ok: false, status: 422, error: `history[${i}].role doit être 'user' ou 'assistant'` };
      }
      if (typeof h.content !== "string" || h.content.length > MAX_MESSAGE_LEN) {
        return { ok: false, status: 422, error: `history[${i}].content dépasse la longueur maximale` };
      }
      history.push({ role: h.role, content: h.content });
    }
  }
  return { ok: true, message: message.trim(), history };
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

  const rl = rateLimit(`chatbot:${auth.userId}`, RATE_MAX, RATE_WINDOW_MS);
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
    return errorResponse(parsed.error, parsed.status, corsHeaders, parsed.details, rateLimitHeaders(rl.remaining, rl.resetAt));
  }

  const { message, history } = parsed;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) {
    const fallback = getFallbackResponse(message);
    log.info("Réponse fallback (pas de clé API)", { userId: auth.userId });
    return jsonResponse(
      { response: fallback, source: "rules" },
      200,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  }

  const messages: Array<{ role: string; content: string }> = [];
  for (const h of history.slice(-MAX_HISTORY)) {
    messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: "user", content: message });

  try {
    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      log.error("Erreur API Anthropic", { status: apiResponse.status, body: errText.slice(0, 500) });
      const fallback = getFallbackResponse(message);
      return jsonResponse(
        { response: fallback, source: "rules" },
        200,
        corsHeaders,
        rateLimitHeaders(rl.remaining, rl.resetAt),
      );
    }

    const data = await apiResponse.json();
    const responseText = data.content?.[0]?.text ?? "Désolé, je n'ai pas pu générer une réponse.";

    log.info("Réponse Claude", { userId: auth.userId });
    return jsonResponse(
      { response: responseText, source: "claude" },
      200,
      corsHeaders,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  } catch (err) {
    log.error("Erreur interne chatbot", { error: String(err) });
    return errorResponse(
      "Erreur interne du serveur",
      500,
      corsHeaders,
      undefined,
      rateLimitHeaders(rl.remaining, rl.resetAt),
    );
  }
});

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("hello")) {
    return "Bonjour ! Je suis l'assistant MentorUADB. Je peux vous aider à comprendre la plateforme, trouver un mentor, ou organiser une session. Posez-moi votre question !";
  }
  if (lower.includes("comment") && (lower.includes("marche") || lower.includes("fonctionne") || lower.includes("utiliser"))) {
    return "MentorUADB permet de mettre en relation des étudiants avec des mentors. Étapes : 1) Créez un compte. 2) Allez dans « Trouver un mentor » et sélectionnez une matière. 3) Envoyez une demande de session. 4) Le mentor accepte ou refuse. 5) Faites votre session (en ligne ou présentiel) et évaluez-la.";
  }
  if (lower.includes("mentor") && (lower.includes("trouver") || lower.includes("chercher"))) {
    return "Pour trouver un mentor : allez dans « Trouver un mentor », filtrez par matière ou filière, puis cliquez sur un mentor pour voir son profil et envoyer une demande de session.";
  }
  if (lower.includes("session") || lower.includes("rendez") || lower.includes("rdv")) {
    return "Une session se demande depuis le profil d'un mentor. Choisissez la matière, la date, l'heure, le mode (en ligne/présentiel) et un sujet. Le mentor devra accepter votre demande.";
  }
  if (lower.includes("matiere") || lower.includes("matières") || lower.includes("cours")) {
    return "Les matières couvrent les 4 composantes de l'UADB : UFR SATIC (Maths, Physique, Chimie, TIC), UFR SDD (Santé, Environnement), UFR ECOMIJ (Économie, Finance, Management, Droit) et ISFAR (Agriculture, Élevage, Foresterie, Génie Rural). Allez dans « Trouver un mentor » pour voir les matières disponibles.";
  }
  if (lower.includes("inscription") || lower.includes("inscrire") || lower.includes("compte")) {
    return "Pour vous inscrire : cliquez sur « Créer un compte », remplissez vos informations (nom, numéro de carte étudiante, niveau, filière, téléphone) et choisissez votre rôle (mentoré, mentor, ou les deux). Un administrateur validera ensuite votre compte.";
  }
  if (lower.includes("devenir") && lower.includes("mentor")) {
    return "Pour devenir mentor : lors de l'inscription, cochez « Mentor ». Une fois connecté, ajoutez vos matières dans votre profil et définissez vos disponibilités. Les mentorés pourront alors vous envoyer des demandes.";
  }
  if (lower.includes("message") || lower.includes("messagerie")) {
    return "La messagerie permet d'échanger avec un mentor ou mentoré. Allez dans « Messagerie », sélectionnez une conversation ou recherchez un utilisateur pour en démarrer une nouvelle.";
  }
  if (lower.includes("evaluation") || lower.includes("évaluation") || lower.includes("note")) {
    return "Après une session terminée, vous pouvez l'évaluer (note sur 5 et commentaire). Les évaluations aident à construire la réputation des mentors et suivre la progression des mentorés.";
  }
  if (lower.includes("disponibil") || lower.includes("créneau") || lower.includes("horaire")) {
    return "Les mentors définissent leurs disponibilités dans leur profil (jours et créneaux horaires). Ces informations aident les mentorés à choisir un mentor disponible.";
  }
  if (lower.includes("validation") || lower.includes("valide") || lower.includes("admin")) {
    return "Les comptes sont validés manuellement par les administrateurs pour s'assurer que seuls de vrais étudiants de l'UADB utilisent la plateforme. Une fois validé, vous avez accès à toutes les fonctionnalités.";
  }
  if (lower.includes("uadb") || lower.includes("université") || lower.includes("filière")) {
    return "L'UADB compte 4 composantes : UFR SATIC (Maths, Physique, Chimie, TIC — Ngoundiane), UFR SDD (Santé, Environnement — Diourbel), UFR ECOMIJ (Économie, Management, Droit — Bambey) et ISFAR (Agriculture, Élevage, Foresterie — Bambey).";
  }
  if (lower.includes("integr") || lower.includes("dériv") || lower.includes("limite") || lower.includes("math")) {
    return "Pour les questions de mathématiques (intégrales, dérivées, limites), je vous recommande de prendre une session avec un mentor en « Analyse Mathématique » ou « Algèbre Linéaire ». Allez dans « Trouver un mentor » pour en trouver un disponible.";
  }
  if (lower.includes("algorithme") || lower.includes("code") || lower.includes("programmation") || lower.includes("bug")) {
    return "Pour les questions de programmation et d'algorithmique, le mieux est de prendre une session avec un mentor en « Algorithmique et Structures de Données » ou dans le langage qui vous intéresse (C, Java, Python). Allez dans « Trouver un mentor » pour en trouver un.";
  }
  if (lower.includes("merci")) {
    return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. Bonne révision !";
  }

  return "Je ne suis pas sûr de pouvoir répondre à cette question précise. Je vous recommande de consulter un mentor dans « Trouver un mentor » pour une aide personnalisée, ou de reformuler votre question sur le fonctionnement de la plateforme.";
}
